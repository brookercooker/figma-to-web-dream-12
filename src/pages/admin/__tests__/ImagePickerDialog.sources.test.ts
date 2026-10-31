import { expect, it, vi } from "vitest";
import { loadLibraryImages } from "../ImagePickerDialog";
const storage = vi.hoisted(() => vi.fn());
vi.mock("@/prototype/client", () => ({ supabase: { storage: { from: storage }, from: () => {
  const q = { select: () => q, is: () => q, limit: async () => ({ data: [{ id: "image", filename: "fixture.webp", web_path: "web/missing.webp", web_url: "/__l5e/assets-v1/fixture.webp", fallback_url: "/fallback.jpg", original_url: "/original.jpg", tags: [] }] }) }; return q;
} } }));
it("loads the stored delivery URL for replacement and toolbar pickers without consulting storage paths", async () => {
  const images = await loadLibraryImages();
  expect(images[0]).toMatchObject({ url: "/__l5e/assets-v1/fixture.webp", fallbackUrl: "/fallback.jpg", originalUrl: "/original.jpg" });
  expect(storage).not.toHaveBeenCalled();
});