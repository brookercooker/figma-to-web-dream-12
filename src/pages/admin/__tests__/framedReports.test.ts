import { describe, expect, it, vi } from "vitest";
vi.mock("../siteManifest", () => ({ isSafePublicFrameUrl: () => true }));
import { replayReports } from "../FramedPageEditor";

describe("framed replay reports", () => {
  it("accepts a well-formed report per scope", () => {
    const r = replayReports({ page: { applied: ["0.1"], orphaned: [{ path: "0.2", kinds: ["style"], reason: "x" }], unchecked: [], rejected: [] } });
    expect(r?.page.orphaned).toHaveLength(1);
  });
  it("rejects malformed reports so no wrong number shows", () => {
    expect(replayReports({ page: { applied: "0.1", orphaned: [], unchecked: [], rejected: [] } })).toBeNull();
    expect(replayReports([1])).toBeNull();
  });
});
