import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/prototype/client";

// Shared cached data hooks for the admin UI. Dedupes across tabs and
// prevents refetching on unrelated re-renders (opening/closing dialogs, etc.).

export function usePages() {
  return useQuery({
    queryKey: ["admin", "pages"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pages")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p: any) => ({ ...p, tags: p.tags ?? [] }));
    },
    staleTime: 30_000,
  });
}

export function useObjects() {
  return useQuery({
    queryKey: ["admin", "objects"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("objects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((o: any) => ({ ...o, tags: o.tags ?? [] }));
    },
    staleTime: 30_000,
  });
}

export function useImages() {
  return useQuery({
    queryKey: ["admin", "images"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("images")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((i: any) => ({ ...i, tags: i.tags ?? [] }));
    },
    staleTime: 30_000,
  });
}

export function useVideos() {
  return useQuery({
    queryKey: ["admin", "videos"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((v: any) => ({ ...v, tags: v.tags ?? [] }));
    },
    staleTime: 30_000,
  });
}



export function usePageObjectsLinks() {
  return useQuery({
    queryKey: ["admin", "page_objects"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("page_objects").select("page_id,object_id");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

// Buckets that are public: their URLs never expire, so no signing is needed.
const PUBLIC_BUCKETS = new Set(["images-web", "videos-web"]);

// Batched thumbnail URLs with Supabase image transform.
export function useImageThumbnails(bucket: string, paths: string[], width = 320) {
  const key = [...paths].sort().join("|");
  return useQuery({
    queryKey: ["admin", "thumbs", bucket, width, key],
    enabled: paths.length > 0,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const map: Record<string, string> = {};
      if (PUBLIC_BUCKETS.has(bucket)) {
        paths.forEach((p) => {
          const { data } = (supabase as any).storage.from(bucket).getPublicUrl(p, {
            transform: { width, resize: "contain", quality: 70 },
          });
          if (data?.publicUrl) map[p] = data.publicUrl;
        });
        return map;
      }
      // Batch in chunks to avoid huge requests
      const chunkSize = 100;
      for (let i = 0; i < paths.length; i += chunkSize) {
        const chunk = paths.slice(i, i + chunkSize);
        const { data, error } = await (supabase as any).storage
          .from(bucket)
          .createSignedUrls(chunk, 60 * 60 * 24 * 7, {
            transform: { width, resize: "contain", quality: 70 },
          });
        if (error) continue;
        (data ?? []).forEach((d: any) => {
          if (d?.path && d?.signedUrl) map[d.path] = d.signedUrl;
        });
      }
      return map;
    },
  });
}

