import { test, expect } from "@playwright/test";
test("a learner fixes a failing expression and preserves the solved drill", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/#learn/change");
  await page.getByRole("link", { name: "このアルゴリズムの実装ドリルへ" }).click();
  await expect(page.locator("#chooseDrill")).toHaveValue("change");
  await page.locator("#drillInput").fill("previous + 1");
  await page.getByRole("button", { name: "テストを実行" }).click();
  await expect(page.locator(".case-row").filter({ hasText: "失敗" }).first()).toBeVisible();
  await page.locator("#drillInput").fill("Math.min(previous + 1, best)");
  await page.getByRole("button", { name: "テストを実行" }).click();
  await expect(page.locator(".verdict")).toContainText("全ケース成功");
  await expect(page.locator("#drillCode")).not.toContainText("blank(");
  await page.reload();
  await expect(page.locator("#chooseDrill option:checked")).toContainText("✓");
  await expect(page.locator("#drillInput")).toHaveValue("Math.min(previous + 1, best)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
