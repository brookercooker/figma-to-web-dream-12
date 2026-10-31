import { test, expect } from "../playwright-fixture";

// Narrow-screen checks for the Site Manager. Requires a signed-in session (restored by the fixture or the harness).
const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 768 },
];

for (const size of SIZES) {
  test.describe(`${size.name} ${size.width}x${size.height}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    test("chat Send is visible and the page never scrolls sideways", async ({ page }) => {
      await page.goto("/manage/preview");
      if (size.name === "phone") await page.getByRole("button", { name: "Chat", exact: true }).click();
      const box = page.getByRole("textbox", { name: "Describe a Change" });
      await box.fill(Array.from({ length: 8 }, (_, i) => `line ${i}`).join("\n"));
      const send = page.getByRole("button", { name: "Send" });
      await expect(send).toBeInViewport();
      const sideways = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(sideways).toBe(false);
    });

    test("Pages shows pages without sideways scroll", async ({ page }) => {
      await page.goto("/manage/pages");
      await expect(page.locator(".manager-static-table tbody tr").first()).toBeVisible();
      if (size.width < 768) {
        await page.getByRole("button", { name: "Filter" }).click();
        await expect(page.locator("[data-labels-panel][data-open]")).toBeVisible();
      }
      const sideways = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(sideways).toBe(false);
    });

    test("Manual Edit keeps Save visible and the editing menu reachable", async ({ page }) => {
      await page.goto("/manage/preview");
      if (size.name === "phone") await page.getByRole("button", { name: "Chat", exact: true }).click();
      await page.getByRole("radio", { name: /Manual Edit/ }).click();
      await expect(page.locator("[data-save-changes]")).toBeVisible();
      await expect(page.locator("[data-save-changes]")).toContainText("Save");
      if (size.name === "phone") {
        await page.getByRole("button", { name: "Page", exact: true }).click();
        await page.getByRole("button", { name: "Show Editing Menu" }).click();
        await expect(page.getByRole("region", { name: "Page Editing Options" })).toBeVisible();
      } else {
        await expect(page.getByRole("region", { name: "Page Editing Options" })).toBeVisible();
      }
    });
  });
}
