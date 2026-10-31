import { test, expect } from "../playwright-fixture";

for (const width of [390, 640, 800]) {
  test(`libraries fit the content pane at ${width}px with chat open`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1024 });
    await page.goto("/manage/pages");
    await page.evaluate(() => localStorage.setItem("siteManager:chatCollapsed", "false"));
    for (const tab of ["images", "objects", "videos", "pages"]) {
      await page.goto(`/manage/${tab}`);
      const search = page.getByRole("textbox", { name: `Search ${tab[0].toUpperCase()}${tab.slice(1)}`, exact: true });
      await expect(search).toBeVisible();
      await expect.poll(async () => (await search.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(200);
      await expect.poll(() => page.locator(".nova-library-area").evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
      await expect(page.getByRole("button", { name: "Labels", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Labels", exact: true }).click();
      await expect(page.getByRole("dialog").getByRole("button", { name: "Create New Label", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
    }
  });
}