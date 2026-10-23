import { describe, it, expect } from "vitest";
import { createReplay, fingerprintOf, fingerprintMatches, withFingerprints, resolvePath, validateEdits, parseKey, hasVisibleEdits, withoutPath } from "../inlineEditCore";
function categories() {
  const root = document.createElement("section");
  root.innerHTML = '<a class="group"><img src="/pendant.jpg?width=800#photo" srcset="/pendant-small.jpg 400w"><h3 style="color: red">Ceiling Lighting</h3><span>Explore <svg class="h-4 w-4"><path d="M0 0"></path></svg></span></a>';
  return root;
}
describe("inlineEditCore", () => {
  it("hashes original text deterministically and ignores image query/fragment", () => {
    const root = categories();
    expect(fingerprintOf(root)).toEqual(fingerprintOf(root));
    const img = root.querySelector('img'); if (!img) throw Error('missing');
    const first = fingerprintOf(img); img.src = '/pendant.jpg?width=200';
    expect(fingerprintMatches(first, fingerprintOf(img))).toBe(true);
  });
  it("records fingerprints from the original after overrides, never overwriting saved ones", () => {
    const root = categories(), replay = createReplay();
    const original = fingerprintOf(root.children[0].children[1]);
    replay.apply(root, { '0.1': 'Edited heading' });
    const edits = withFingerprints({ '0.1': 'Edited heading' }, root, resolvePath);
    expect(JSON.parse(edits['fp:0.1'])).toEqual(original);
    expect(withFingerprints(edits, root, resolvePath)).toEqual(edits);
  });
  it("blocks a shifted path after an earlier sibling is inserted", () => {
    const original = categories();
    const edits = withFingerprints({ '0.1': 'Wrong heading' }, original, resolvePath);
    const root = categories(); root.children[0].insertBefore(document.createElement('p'), root.children[0].children[1]);
    const report = createReplay().apply(root, edits);
    expect(report.orphaned).toHaveLength(1); expect(root.textContent).toContain('Ceiling Lighting');
    expect(root.textContent).not.toContain('Wrong heading');
  });
  it("blocks changed original text and all kinds at its path", () => {
    const edits = withFingerprints({ '0.1': 'Override', 'style:0.1': '{"color":"blue"}' }, categories(), resolvePath);
    const root = categories(); root.children[0].children[1].textContent = 'Wall Lighting';
    const report = createReplay().apply(root, edits);
    expect(report.applied).toEqual([]); expect(report.orphaned[0].kinds).toEqual(['html','style']);
    expect(root.children[0].children[1].getAttribute('style')).toBe('color: red');
  });
  it("does not apply a picture override to text", () => {
    const root = categories();
    expect(createReplay().apply(root, { 'img:0.1': '/new.jpg' }).orphaned).toHaveLength(1);
    expect(root.children[0].children[1].hasAttribute('src')).toBe(false);
  });
  it("keeps legacy overrides working and reports unchecked paths once", () => {
    const root = categories(); const report = createReplay().apply(root, { '0.1': 'New', 'style:0.1': '{"color":"blue"}' });
    expect(root.children[0].children[1].textContent).toBe('New'); expect(report.unchecked).toEqual(['0.1']);
  });
  it("restores original text, src, srcset, exact style and icon on key removal", () => {
    const root = categories(), before = root.innerHTML, replay = createReplay();
    replay.apply(root, { '0.1': 'New', 'img:0.0': '/new.jpg', 'style:0.1': '{"color":"blue"}', 'icon:0.2': 'none' });
    expect(root.innerHTML).not.toBe(before); replay.apply(root, {}); expect(root.innerHTML).toBe(before);
  });
  it("restores removed style properties including original priority", () => {
    const root = categories(), replay = createReplay();
    replay.apply(root, { 'style:0.1': '{"color":"blue","font-weight":"700"}' });
    replay.apply(root, { 'style:0.1': '{"font-weight":"700"}' });
    const h = root.querySelector('h3'); expect(h?.style.color).toBe('red'); expect(h?.style.getPropertyPriority('color')).toBe('');
  });
  it("does not cause any second live DOM mutation including HTML plus icon and priorities", () => {
    const root = categories(), replay = createReplay();
    const edits = { '0.2': 'Explore <svg><path d="M0 0"></path></svg>', 'icon:0.2': 'ArrowRight', 'style:0.1': '{"color":"blue"}', 'img:0.0': '/new.jpg' };
    const opts = { iconMarkup: () => '<svg><path d="M1 1"></path></svg>' };
    replay.apply(root, edits, opts);
    const observer = new MutationObserver(() => {}); observer.observe(root, { subtree: true, childList: true, attributes: true, characterData: true });
    replay.apply(root, edits, opts); expect(observer.takeRecords()).toEqual([]); observer.disconnect();
  });
  it("rejects unsafe CSS, javascript pictures, malformed styles and bad paths", () => {
    const { ok, rejected } = validateEdits({ 'style:0': '{"color":"url(evil)"}', 'style:1': '{"color":"javascript:evil"}', 'img:0': 'javascript:evil', '0.-1': 'wrong', 'style:2': '[]', 'style:3': '{"position":"fixed"}', '4': 42 });
    expect(ok).toEqual({}); expect(rejected).toHaveLength(7);
  });
  it("cleans HTML at replay and fails closed for a malformed fingerprint", () => {
    const root = categories(), replay = createReplay();
    replay.apply(root, { '0.1': '<b>Safe</b><script>bad()</script><a href="javascript:bad()">Link</a>' });
    expect(root.querySelector('script,a[href^="javascript"]')).toBeNull();
    const next = categories(); expect(createReplay().apply(next, { '0.1': 'Wrong', 'fp:0.1': '{}' }).orphaned).toHaveLength(1);
    expect(next.textContent).toContain('Ceiling Lighting');
  });
  it("never treats fingerprints as HTML or visible edits and removes metadata on reset", () => {
    const root = categories(), fp = JSON.stringify(fingerprintOf(root));
    expect(parseKey('fp:')).toEqual({kind:'fp',path:''}); expect(parseKey('html:0')).toBeNull();
    expect(hasVisibleEdits({'fp:':fp})).toBe(false);
    expect(createReplay().apply(root, {'fp:':fp}).applied).toEqual([]);
    expect(withoutPath({'0':'text','style:0':'{}','fp:0':fp},'0')).toEqual({});
    expect(withFingerprints({'fp:0':fp},root,resolvePath)).toEqual({});
  });
  it("restoreAll restores every root", () => {
    const a = categories(), b = categories(), replay = createReplay();
    replay.apply(a, {'0.1':'A'}); replay.apply(b, {'0.1':'B'}); replay.restoreAll();
    expect(a.textContent).toContain('Ceiling Lighting'); expect(b.textContent).toContain('Ceiling Lighting');
  });
});
