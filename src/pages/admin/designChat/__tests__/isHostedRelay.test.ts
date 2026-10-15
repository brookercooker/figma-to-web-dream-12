import { describe, it, expect } from "vitest";
import { isHostedRelay } from "../helper";

describe("isHostedRelay", () => {
  const cases: [string, boolean][] = [
    ["https://nova-relay.a02392549.workers.dev", true],
    ["https://example.com/__prototyper", true],
    ["http://127.0.0.1:4321/__prototyper", false],
    ["https://localhost:3000", false],
    ["https://127.0.0.1", false],
    ["https://app.localhost", false],
    ["http://example.com", false],
    ["", false],
    ["not a url", false],
  ];
  it.each(cases)("%s -> %s", (url, expected) => {
    expect(isHostedRelay(url)).toBe(expected);
  });
});
