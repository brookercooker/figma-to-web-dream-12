import { useCallback, useRef, useState } from "react";
import { DEFAULT_UPLOADS, RELAY, type UploadRules } from "./helper";
import { fileProblem } from "./logic";

export type Attached = { key: number; name: string; size: number; status: "uploading" | "ready"; id: string | null };

/**
 * Files attached to the next request. Each goes to the helper as soon as it is chosen, so a problem shows up right away;
 * the helper passes them to the builder when the request is sent.
 */
export function useAttachments(rules: UploadRules | undefined, say: (text: string, bad?: boolean) => void) {
  const [files, setFiles] = useState<Attached[]>([]);
  const filesRef = useRef<Attached[]>([]);
  const nextKey = useRef(0);
  const pasted = useRef(0);
  const set = (next: Attached[]) => { filesRef.current = next; setFiles(next); };

  const forget = (id: string) =>
    fetch(`${RELAY}/api/upload-remove`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});

  const remove = useCallback((key: number) => {
    const f = filesRef.current.find((x) => x.key === key);
    set(filesRef.current.filter((x) => x.key !== key));
    if (f?.id) forget(f.id);
  }, []);

  const add = useCallback((list: FileList | File[] | null | undefined) => {
    const lim = rules ?? DEFAULT_UPLOADS;
    for (const file of Array.from(list ?? [])) {
      const problem = fileProblem(file, lim, filesRef.current.length);
      if (problem) { say(problem, true); if (problem.startsWith("You can attach up to")) break; continue; }
      const item: Attached = { key: ++nextKey.current, name: file.name, size: file.size, status: "uploading", id: null };
      set([...filesRef.current, item]);
      (async () => {
        try {
          const res = await fetch(`${RELAY}/api/upload?name=${encodeURIComponent(file.name)}`, {
            method: "POST",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });
          const data = await res.json().catch(() => ({}));
          if (res.status === 404) throw new Error("File attachments need the newest version of the design helper. Restart it, then try again.");
          if (!res.ok) throw new Error(data.error || "That file couldn't be attached.");
          if (!filesRef.current.some((x) => x.key === item.key)) { forget(data.id); return; } // removed while it was uploading
          set(filesRef.current.map((x) => (x.key === item.key ? { ...x, id: data.id, name: data.name || x.name, status: "ready" } : x)));
        } catch (e) {
          set(filesRef.current.filter((x) => x.key !== item.key));
          say(e instanceof TypeError ? "Can't reach the design service right now. Try attaching again in a moment." : (e as Error).message, true);
        }
      })();
    }
  }, [rules, say]);

  /** Screenshots pasted from the clipboard are all called "image.png"; give each its own name. */
  const addPasted = useCallback((list: File[]) => {
    add(list.map((f) => (/^image\.\w+$/i.test(f.name)
      ? new File([f], `pasted-image-${++pasted.current}.${(f.type.split("/")[1] || "png").replace("jpeg", "jpg")}`, { type: f.type })
      : f)));
  }, [add]);

  const uploading = files.some((f) => f.status === "uploading");
  const ids = () => filesRef.current.filter((f) => f.status === "ready" && f.id).map((f) => f.id as string);
  const clear = useCallback(() => set([]), []);
  return { files, uploading, add, addPasted, remove, ids, clear };
}
