// EXIF extraction + reverse-geocoding for images.
// Called on upload (from the file object) and as a background backfill
// (fetching the original from a signed URL). Failures are swallowed —
// we just mark exif_extracted_at so we don't retry forever.
import exifr from "exifr";
import { supabase } from "@/integrations/supabase/client";

export interface ExifResult {
  taken_at: string | null;
  camera: string | null;
  lens: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
}

const EXIF_OPTS: any = {
  tiff: true,
  exif: true,
  gps: true,
  xmp: true,
  icc: false,
  iptc: true,
  jfif: false,
  ihdr: false,
  translateKeys: true,
  translateValues: true,
  reviveValues: true,
  sanitize: true,
  mergeOutput: true,
};

function pickString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

export async function extractExifFromSource(source: Blob | ArrayBuffer | string): Promise<ExifResult> {
  const empty: ExifResult = { taken_at: null, camera: null, lens: null, gps_lat: null, gps_lng: null };
  try {
    const data: any = await exifr.parse(source as any, EXIF_OPTS);
    if (!data) return empty;
    // EXIF first, then XMP (Photoshop/Lightroom often preserve these on PNG re-exports),
    // then IPTC as a last resort.
    const taken =
      data.DateTimeOriginal ||
      data.CreateDate ||
      data.DateTime ||
      data.ModifyDate ||
      data.DateCreated ||
      data.DateTimeDigitized ||
      data["photoshop:DateCreated"] ||
      data["xmp:CreateDate"] ||
      data["xmp:ModifyDate"] ||
      null;

    let takenIso: string | null = null;
    if (taken instanceof Date && !isNaN(taken.getTime())) {
      takenIso = taken.toISOString();
    } else if (typeof taken === "string") {
      const d = new Date(taken);
      if (!isNaN(d.getTime())) takenIso = d.toISOString();
    }
    const make = pickString(data.Make);
    const model = pickString(data.Model);
    const camera = [make, model].filter(Boolean).join(" ") || null;
    const lens =
      pickString(data.LensModel) ||
      pickString(data.Lens) ||
      pickString(data.LensMake) ||
      null;
    let lat: number | null = null;
    let lng: number | null = null;
    if (typeof data.latitude === "number" && typeof data.longitude === "number") {
      lat = data.latitude;
      lng = data.longitude;
    } else if (Array.isArray(data.GPSLatitude) && Array.isArray(data.GPSLongitude)) {
      // Fallback shouldn't be needed with mergeOutput, but be defensive.
      const toDec = (arr: number[], ref?: string) => {
        const [d = 0, m = 0, s = 0] = arr;
        const dec = d + m / 60 + s / 3600;
        return ref === "S" || ref === "W" ? -dec : dec;
      };
      lat = toDec(data.GPSLatitude, data.GPSLatitudeRef);
      lng = toDec(data.GPSLongitude, data.GPSLongitudeRef);
    }
    return {
      taken_at: takenIso,
      camera,
      lens,
      gps_lat: typeof lat === "number" && isFinite(lat) ? lat : null,
      gps_lng: typeof lng === "number" && isFinite(lng) ? lng : null,
    };
  } catch {
    return empty;
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ place_name: string | null; details: unknown | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("reverse-geocode", {
      body: { lat, lng },
    });
    if (error) return { place_name: null, details: null };
    return {
      place_name: (data as any)?.place_name ?? null,
      details: (data as any)?.details ?? null,
    };
  } catch {
    return { place_name: null, details: null };
  }
}

// Extract + geocode + persist. Used on upload (with a File) and on backfill
// (with a Blob fetched from a signed URL).
export async function extractAndPersistExif(
  imageId: string,
  source: Blob | ArrayBuffer,
): Promise<void> {
  const exif = await extractExifFromSource(source);
  let place_name: string | null = null;
  let place_details: unknown | null = null;
  if (exif.gps_lat != null && exif.gps_lng != null) {
    const g = await reverseGeocode(exif.gps_lat, exif.gps_lng);
    place_name = g.place_name;
    place_details = g.details;
  }
  await (supabase as any)
    .from("images")
    .update({
      taken_at: exif.taken_at,
      camera: exif.camera,
      lens: exif.lens,
      gps_lat: exif.gps_lat,
      gps_lng: exif.gps_lng,
      place_name,
      place_details,
      exif_extracted_at: new Date().toISOString(),
    })
    .eq("id", imageId);
}
