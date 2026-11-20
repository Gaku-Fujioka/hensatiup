import { test, expect } from "@playwright/test";
import { catalog } from "../src/catalog.js";

test("all lessons render, finish and expose their question at mobile width", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 375, height: 812 });
  for (const lesson of catalog) {
    await page.goto("/#learn/" + lesson.id);
    await expect(page.locator("#library h1")).toHaveText(lesson.title);
    await expect(page.locator(".observation-prompt")).not.toBeEmpty();
    await page.locator("#traceNext").click();
    if (lesson.id === "bfs") await expect(page.locator("#traceState svg")).toBeVisible();
    if (lesson.id === "lcs") await expect(page.locator(".dp-matrix .current")).toBeVisible();
    await page.locator("#traceEnd").click();
    await expect(page.locator("#answer")).not.toHaveText("最後のステップで確認");
    await expect(page.locator("#practiceSlot button")).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), lesson.id).toBeLessThanOrEqual(
      375,
    );
  }
  expect(errors).toEqual([]);
});
test("incorrect answers become review items and corrected answers persist", async ({ page }) => {
  await page.goto("/#learn/change");
  await page.getByRole("button", { name: "3枚", exact: true }).click();
  await page.getByRole("link", { name: "全教材を見る" }).click();
  await page.locator("#studyFilter").selectOption("review");
  await expect(page.locator(".lesson-card")).toHaveCount(1);
  await page.locator(".lesson-card").click();
  await page.getByRole("button", { name: "2枚", exact: true }).click();
  await page.reload();
  await expect(page.locator("#progress")).toHaveText("1 / " + catalog.length);
  await expect(page.locator(".check-answer")).toContainText("前回のチェックは正解");
});
test("the comparison passes the exact input through to the selected lesson", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "ソート比較実験" }).click();
  await page.getByRole("button", { name: "逆順", exact: true }).click();
  await expect(page.locator("#sortRows .sort-row")).toHaveCount(6);
  await page.getByRole("link", { name: "挿入ソート", exact: true }).click();
  await expect(page.locator("#lessonInput")).toHaveValue('{"values":[8,7,6,5,4,3,2,1]}');
});
