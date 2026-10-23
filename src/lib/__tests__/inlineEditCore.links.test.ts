import { afterEach, describe, expect, it, vi } from "vitest";
import { createReplay, installLinkHandler, originalLink, parseKey, validateEdits, withFingerprints, withoutPath, hasVisibleEdits } from "../inlineEditCore";
const encoded = (value: unknown) => JSON.stringify(value);
const card = () => {
  const root = document.createElement("section");
  root.innerHTML = '<a href="/original" target="_self" rel="author" class="group"><span>Ceiling Lighting</span></a><button class="cta"><span>Explore</span></button>';
  return root;
};
afterEach(() => { document.body.innerHTML = ""; vi.restoreAllMocks(); });
describe("link overrides", () => {
  it.each([{ href: "/lighting" }, { href: "https://example.com", target: "_blank" }, { unlinked: true }])("accepts %j", (value) => {
    expect(validateEdits({ "link:0": encoded(value) }).rejected).toEqual([]);
  });
  it.each([{ href: "javascript:alert(1)" }, { href: "//evil.com" }, { href: "data:text/plain,hi" }, { href: "/ok", extra: true }, { href: "/ok", unlinked: true }, { target: "_blank" }, { href: "/ok", target: "_self" }, { unlinked: false }, {}, [], null])("rejects %j", (value) => {
    expect(validateEdits({ "link:0": encoded(value) }).ok).toEqual({});
  });
  it("replays anchor/button destinations and exact resets without changing children or classes", () => {
    const root = card(), replay = createReplay(), anchor = root.children[0], button = root.children[1];
    const children = anchor.firstChild, classes = anchor.className;
    replay.apply(root, { "link:0": encoded({ href: "/new", target: "_blank" }), "link:1": encoded({ href: "/button", target: "_blank" }) });
    expect(anchor.getAttribute("href")).toBe("/new"); expect(anchor.getAttribute("target")).toBe("_blank");
    expect(anchor.getAttribute("rel")).toBe("noopener noreferrer");
    expect(button.hasAttribute("href")).toBe(false); expect(button.getAttribute("data-inline-href")).toBe("/button");
    expect(button.getAttribute("data-inline-target")).toBe("_blank");
    expect(originalLink(anchor)).toEqual({ href: "/original", target: "_self" });
    replay.apply(root, { "link:0": encoded({ unlinked: true }) });
    expect(anchor.hasAttribute("href")).toBe(false); expect(anchor.getAttribute("data-inline-link")).toBe("off");
    expect(anchor.firstChild).toBe(children); expect(anchor.className).toBe(classes);
    replay.apply(root, {});
    expect(anchor.getAttribute("href")).toBe("/original"); expect(anchor.getAttribute("target")).toBe("_self");
    expect(anchor.getAttribute("rel")).toBe("author"); expect(anchor.hasAttribute("data-inline-link")).toBe(false);
    expect(button.hasAttribute("data-inline-href")).toBe(false); expect(button.hasAttribute("data-inline-target")).toBe(false);
    expect(anchor.firstChild).toBe(children); expect(anchor.className).toBe(classes);
  });
  it("clears an edited new-tab setting and performs no second DOM writes", () => {
    const root = card(), replay = createReplay();
    const edits = { "link:0": encoded({ href: "/new", target: "_blank" }) };
    replay.apply(root, edits);
    const observer = new MutationObserver(() => {}); observer.observe(root, { attributes: true, childList: true, subtree: true });
    replay.apply(root, edits); expect(observer.takeRecords()).toEqual([]); observer.disconnect();
    replay.apply(root, { "link:0": encoded({ href: "/new" }) });
    expect(root.children[0].getAttribute("target")).toBeNull();
    expect(root.children[0].getAttribute("rel")).toBe("author");
  });
  it("fails closed after sibling insertion and shares fingerprint metadata", () => {
    const root = card();
    const edits = withFingerprints({ "link:0": encoded({ href: "/new" }) }, root);
    expect(edits["fp:0"]).toBeDefined(); expect(parseKey("link:0")).toEqual({ kind: "link", path: "0" });
    expect(hasVisibleEdits(edits)).toBe(true); expect(withoutPath(edits, "0")).toEqual({});
    const changed = card(); changed.insertBefore(document.createElement("p"), changed.firstChild);
    expect(createReplay().apply(changed, edits).orphaned[0].kinds).toEqual(["link"]);
    expect(changed.children[1].getAttribute("href")).toBe("/original");
  });
});
describe("capture-phase link handling", () => {
  it.each([{ href: "/new" }, { unlinked: true }])("suppresses the original handler for %j", (link) => {
    const root = card(); document.body.append(root);
    createReplay().apply(root, { "link:0": encoded(link) });
    const original = vi.fn(), navigate = vi.fn(() => true);
    root.children[0].addEventListener("click", original);
    const uninstall = installLinkHandler(document, { navigate });
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    root.children[0].firstChild?.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true); expect(original).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledTimes("href" in link ? 1 : 0); uninstall();
  });
  it.each(["unchanged", "disabled", "uninstalled"])("leaves %s clicks untouched", (mode) => {
    const button = document.createElement("button"); document.body.append(button);
    if (mode !== "unchanged") { button.dataset.inlineLink = "1"; button.dataset.inlineHref = "/new"; }
    const original = vi.fn(); button.addEventListener("click", original);
    const uninstall = installLinkHandler(document, { enabled: () => mode !== "disabled" });
    if (mode === "uninstalled") uninstall();
    const event = new MouseEvent("click", { bubbles: true, cancelable: true }); button.dispatchEvent(event);
    expect(original).toHaveBeenCalledOnce(); expect(event.defaultPrevented).toBe(false); uninstall();
  });
  it.each(["ctrlKey", "metaKey", "shiftKey"])("opens %s clicks in a safe new tab", (modifier) => {
    const root = card(); document.body.append(root); createReplay().apply(root, { "link:1": encoded({ href: "/new" }) });
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const uninstall = installLinkHandler(document);
    root.children[1].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, [modifier]: true }));
    expect(open).toHaveBeenCalledWith("/new", "_blank", "noopener,noreferrer"); uninstall();
  });
  it("scrolls anchors and updates the hash without routing", () => {
    const root = card(), destination = document.createElement("div"); destination.id = "lighting";
    destination.scrollIntoView = vi.fn(); document.body.append(root, destination);
    createReplay().apply(root, { "link:0": encoded({ href: "#lighting" }) });
    const navigate = vi.fn(), push = vi.spyOn(window.history, "pushState");
    const uninstall = installLinkHandler(document, { navigate });
    root.children[0].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(destination.scrollIntoView).toHaveBeenCalledOnce(); expect(push).toHaveBeenCalledWith(null, "", "#lighting");
    expect(navigate).not.toHaveBeenCalled(); uninstall();
  });
  it("leaves native anchor auxclick alone but routes button auxclick", () => {
    const root = card(); document.body.append(root);
    createReplay().apply(root, { "link:0": encoded({ href: "/new" }), "link:1": encoded({ href: "/button" }) });
    const open = vi.spyOn(window, "open").mockReturnValue(null), uninstall = installLinkHandler(document);
    const auxiliary = new MouseEvent("auxclick", { button: 1, bubbles: true, cancelable: true });
    root.children[0].dispatchEvent(auxiliary); expect(auxiliary.defaultPrevented).toBe(false);
    root.children[1].dispatchEvent(new MouseEvent("auxclick", { button: 1, bubbles: true, cancelable: true }));
    expect(open).toHaveBeenCalledWith("/button", "_blank", "noopener,noreferrer"); uninstall();
  });
});