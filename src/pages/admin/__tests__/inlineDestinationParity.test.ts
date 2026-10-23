import { expect, it } from "vitest";
import { validInlineHref } from "../inlineLinks";
import { validLinkHref } from "@/lib/inlineEditCore";
it.each([
  ["https://example.com/a?b=c", true], ["http://example.com", true], ["/lighting", true],
  ["mailto:staff@example.com", true], ["tel:+15555555555", true], ["#anchor", true],
  ["", false], ["javascript:alert(1)", false], ["//evil.com", false], ["data:image/png,hi", false],
  ["https://", false], ["/some path", false], ["/path\\evil", false], ["/path\u0000", false],
  ["https://example.com\n", false], ["ftp://example.com", false], ["lighting", false],
] as const)("matches rich-text validation for %s", (href, allowed) => {
  expect(validLinkHref(href)).toBe(allowed); expect(validInlineHref(href)).toBe(allowed);
  expect(validLinkHref(href)).toBe(validInlineHref(href));
});