import { captureConfigured } from "./config.ts";

Deno.test("thumbnail capture refuses the reported placeholder account", () => {
  if (captureConfigured("PLACEHOLDER_VALUE_TO_BE_REPLACED", "test-token")) throw new Error("Placeholder must be skipped");
});

Deno.test("thumbnail capture requires both configured credentials", () => {
  const id = "a".repeat(32);
  if (captureConfigured(undefined, "test-token") || captureConfigured(id, undefined)) throw new Error("Missing credentials must be skipped");
  if (!captureConfigured(id, "test-token")) throw new Error("Valid configuration must allow capture");
});