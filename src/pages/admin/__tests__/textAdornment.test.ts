import { expect, it } from "vitest";
import { validTextLink } from "../textAdornment";
import { editMap } from "../framedPageProtocol";

it.each(["https://example.com/path?x=1#text", "mailto:staff@example.com", "tel:+15555555555", "/about", "/?q=light", "/"])('accepts permitted text destination %s', value => expect(validTextLink(value)).toBe(true));
it.each(["javascript:alert(1)", "data:text/html,hi", "http://example.com", "ftp://example.com", "//evil.example", "/\\evil.example", "https://", "mailto:", "tel:", "#fragment", " /about", "/bad\npath"])("rejects text destination %s", value => expect(validTextLink(value)).toBe(false));
it.each(["before", "after"])("accepts %s icon placement alongside existing scoped edits", position => {
  const next = { "icon:0.1": "Mail", "icon-position:0.1": position, "link:0.1": JSON.stringify({ href: "/about" }) };
  expect(editMap(next)).toEqual(next);
});
it.each([{ "icon-position:0": "middle" }, { "icon-position:bad": "before" }, { "icon-position:0": 1 }, { "icon-position:0": "before", "unknown:0": "bad" }])("rejects unsafe icon placement maps %j", value => expect(editMap(value)).toBeNull());