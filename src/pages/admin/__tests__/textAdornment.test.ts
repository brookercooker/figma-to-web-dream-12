import { expect, it } from "vitest";
import { validTextLink } from "../textAdornment";
import { editMap } from "../framedPageProtocol";
import { createReplay, withFingerprints, withoutPath, inlineText, resolvePath, validateEdits } from "@/lib/inlineEditCore";
import { ManualEditHistory } from "../designChat/manualEditHistory";
import { replayReports } from "../FramedPageEditor";

it.each(["https://example.com/path?x=1#text", "mailto:staff@example.com", "tel:+15555555555", "/about", "/?q=light", "/"])('accepts permitted text destination %s', value => expect(validTextLink(value)).toBe(true));
it.each(["javascript:alert(1)", "data:text/html,hi", "http://example.com", "ftp://example.com", "//evil.example", "/\\evil.example", "https://", "mailto:", "tel:", "#fragment", " /about", "/bad\npath"])("rejects text destination %s", value => expect(validTextLink(value)).toBe(false));
it.each(["before", "after"])("round-trips %s placement through core validation, save, undo, reload and record", position => {
  const root = document.createElement("section"); root.innerHTML = "<h2>Nova <b>Lighting</b></h2>";
  const original = root.innerHTML;
  const edits = withFingerprints({ "icon:0": "material:outlined:home", "icon-position:0": position }, root);
  expect(validateEdits(edits)).toEqual({ ok: edits, rejected: [] });
  const before = { blocks: [], inlineEdits: {}, objectEdits: {} };
  const after = { ...before, inlineEdits: edits };
  const history = new ManualEditHistory(); history.record(before, after, { label: "icon placement" });
  const saved = editMap(JSON.parse(JSON.stringify(edits)));
  expect(saved).toEqual(edits); // same validator as edit-change / edit-query record replies
  const replay = createReplay();
  const opts = { iconMarkup: () => '<span data-inline-icon="material:outlined:home" aria-hidden="true">home</span>' };
  const report = replay.apply(root, saved ?? {}, opts);
  expect(replayReports({ page: report })?.page.applied).toContain("icon-position:0");
  expect(inlineText(root)).toBe("Nova Lighting");
  expect(resolvePath(root, "0.0")?.tagName).toBe("B");
  const heading = root.querySelector("h2");
  expect((position === "before" ? heading?.firstChild : heading?.lastChild) instanceof Element).toBe(true);
  expect((position === "before" ? heading?.firstElementChild : heading?.lastElementChild)?.getAttribute("data-inline-icon")).toBe("material:outlined:home");
  replay.apply(root, saved ?? {}, opts); expect(root.querySelectorAll("[data-inline-icon]")).toHaveLength(1);
  expect(withFingerprints(saved ?? {}, root)).toEqual(edits);
  replay.apply(root, history.undo()?.inlineEdits ?? {}, opts); expect(root.innerHTML).toBe(original);
  expect(history.redo()?.inlineEdits).toEqual(edits);
  const reloaded = document.createElement("section"); reloaded.innerHTML = original;
  expect(createReplay().apply(reloaded, saved ?? {}, opts).rejected).toEqual([]);
  expect(reloaded.innerHTML).toBe(heading?.parentElement?.innerHTML === original ? (() => { replay.apply(root, edits, opts); return root.innerHTML; })() : root.innerHTML);
  const wording = editMap({ ...edits, "0": "New <b>wording</b>" });
  expect(wording?.["icon:0"]).toBe("material:outlined:home"); expect(wording?.["icon-position:0"]).toBe(position);
  expect(withoutPath(edits, "0")).toEqual({});
});