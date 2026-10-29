import { describe, expect, it, vi } from "vitest";
import { deleteImageFilesAndRows } from "../deleteImages";
describe("image removal", () => {
  function client(fail = false) {
    const remove = vi.fn(async () => ({ error: fail ? new Error("File removal failed") : null }));
    const rows = vi.fn(async () => ({ error: null }));
    const from = vi.fn(() => ({ delete: () => ({ in: rows }) }));
    const bucket = vi.fn(() => ({ remove }));
    return { db: { storage: { from: bucket }, from }, remove, rows, bucket, from };
  }
  it("removes originals, the correct public/private files and fallbacks before rows", async () => {
    const c = client();
    await deleteImageFilesAndRows([{ id: "p", original_path: "p.jpg", web_path: "p.webp", fallback_path: "p-f.jpg" }, { id: "g", web_path: "g.webp", visibility: "gated" }], c.db);
    expect(c.bucket.mock.calls.map(([name]) => name)).toEqual(["images-original", "images-web", "images-web-gated"]);
    expect(c.remove.mock.calls.map(() => true)).toHaveLength(3);
    expect(c.remove).toHaveBeenCalledWith(["p.webp", "p-f.jpg"]);
    expect(c.rows).toHaveBeenCalledWith("id", ["p", "g"]);
  });
  it("does not delete the row when file removal fails", async () => {
    const c = client(true);
    await expect(deleteImageFilesAndRows([{ id: "p", web_path: "p.webp" }], c.db)).rejects.toThrow("File removal failed");
    expect(c.from).not.toHaveBeenCalled();
  });
});