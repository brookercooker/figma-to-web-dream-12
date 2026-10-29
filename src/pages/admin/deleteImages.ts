import { supabase } from "@/prototype/client";
import { GATED_BUCKET } from "@/lib/assetUrl";
export interface DeletableImage {
  id: string; original_path?: string | null; web_path?: string | null; fallback_path?: string | null; visibility?: string;
}
/** The existing five-second undo scheduler calls this only when its window expires. */
export async function deleteImageFilesAndRows(images: DeletableImage[], db = supabase as any) {
  const buckets = new Map<string, Set<string>>();
  const add = (bucket: string, path: string | null | undefined) => {
    if (!path) return;
    const paths = buckets.get(bucket) ?? new Set<string>(); paths.add(path); buckets.set(bucket, paths);
  };
  for (const image of images) {
    add("images-original", image.original_path);
    const bucket = image.visibility === "gated" ? GATED_BUCKET : "images-web";
    add(bucket, image.web_path); add(bucket, image.fallback_path);
  }
  for (const [bucket, paths] of buckets) {
    const { error } = await db.storage.from(bucket).remove([...paths]);
    if (error) throw error;
  }
  const { error } = await db.from("images").delete().in("id", images.map(image => image.id));
  if (error) throw error;
}