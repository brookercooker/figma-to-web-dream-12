import { describe, expect, it } from "vitest";
import { tradeDocumentProblem } from "./tradeDocumentRules";
describe("trade certificate restrictions", () => {
  it.each(["application/pdf", "image/jpeg", "image/png"])("accepts %s through 10 MB", (type) => {
    expect(tradeDocumentProblem({ type, size: 10 * 1024 * 1024 })).toBeNull();
  });
  it("rejects files larger than 10 MB", () => {
    expect(tradeDocumentProblem({ type: "application/pdf", size: 10 * 1024 * 1024 + 1 })).toBeTruthy();
  });
  it.each(["image/webp", "image/heic", "application/octet-stream", ""])("rejects %s", (type) => {
    expect(tradeDocumentProblem({ type, size: 100 })).toBeTruthy();
  });
});