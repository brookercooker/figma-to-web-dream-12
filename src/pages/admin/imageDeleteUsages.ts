import { supabase } from "@/prototype/client";
import type { DeletableImage } from "./deleteImages";
export interface ImageUsageTarget { name: string; content?: unknown; inline_edits?: unknown }
export function imageUsageNames(images: (DeletableImage & { web_url?: string; original_url?: string })[], targets: ImageUsageTarget[]) {
  const needles = images.flatMap(image => [image.id, image.web_path, image.original_path, image.web_url, image.original_url]).filter((value): value is string => !!value);
  return targets.filter(target => {
    const value = JSON.stringify([target.content, target.inline_edits]);
    return needles.some(needle => value.includes(needle));
  }).map(target => target.name);
}
/** Include saved page tweaks and Draft objects, not just the public code usage scan. */
export async function loadImageDeleteUsageNames(images: (DeletableImage & { web_url?: string; original_url?: string })[]) {
  const db = supabase as any;
  const results = await Promise.all([
    db.from("pages").select("name,content,inline_edits").is("archived_at", null),
    db.from("object_registry").select("name,content,inline_edits").is("archived_at", null),
  ]);
  if (results.some(result => result.error)) throw new Error("Couldn't check where this image is used. Try again.");
  return [...new Set(imageUsageNames(images, results.flatMap(result => result.data ?? [])))];
}