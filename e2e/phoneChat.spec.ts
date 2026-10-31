import { test, expect } from "../playwright-fixture";

for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 740 }]) {
  test.describe(`phone pop-out ${viewport.width}`, () => {
    test.use({ viewport });
    test("retains drafts and the preview while closing by button, outside strip, swipe and Escape", async ({ page }) => {
      await page.goto("/manage/preview");
      const open = page.getByRole("button", { name: "Open chat", exact: true });
      const preview = page.locator("iframe[data-site-preview]").first();
      await expect(open).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Panes" })).toHaveCount(0);
      await open.click();
      const box = page.getByRole("textbox", { name: "Describe a Change" });
      await expect(box).toBeFocused();
      await box.fill("Keep this draft");
      await expect(page.getByRole("button", { name: "Send", exact: true })).toBeInViewport();
      await page.getByRole("button", { name: "Close chat", exact: true }).click();
      await open.click(); await expect(box).toHaveValue("Keep this draft");
      await page.getByRole("button", { name: "Back to page", exact: true }).click({ position: { x: 20, y: 60 } });
      await open.click(); await page.keyboard.press("Escape"); await expect(open).toBeVisible();
      await open.click();
      await page.waitForTimeout(250);
      const handle = await page.locator("[data-chat-handle]").boundingBox();
      if (!handle) throw new Error("Missing sheet handle");
      await page.mouse.move(handle.x + 30, handle.y + 8); await page.mouse.down();
      await page.mouse.move(handle.x + 30, handle.y + 100); await page.mouse.up();
      await expect(open).toBeVisible();
      await expect(preview).toBeVisible();
      const bounds = await preview.boundingBox(); const button = await open.boundingBox();
      expect(bounds?.height ?? 0).toBeGreaterThan(500);
      expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(button?.y ?? 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  });
}