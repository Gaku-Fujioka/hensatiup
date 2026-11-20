import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 } });
const inspect = (page) => page.getByRole("button", { name: "この条件でコードと手順を見る" });

test("search by purpose and replay the application example", async ({ page }) => {
  await page.goto("/#library");
  await page.getByRole("searchbox").fill("整理券");
  await page.locator(".lesson-card").click();
  await expect(page.getByRole("heading", { name: "このアルゴリズムでできること" })).toBeVisible();
  await page.getByRole("button", { name: "この実用例で手順を見る" }).click();
  await page.locator("#traceEnd").click();
  await expect(page.locator("#answer")).toHaveText("4");
});

test("load a rescue truck and carry the changed capacity through to the code", async ({ page }) => {
  await page.goto("/#library");
  await page.locator('a[href="#apply/knapsack"]').click();
  const result = page.locator(".applied-result");
  await expect(result).toContainText("救急箱・ランタン・浄水器（10 kg、21ポイント）");
  for (const name of ["救急箱", "ランタン", "浄水器"]) await page.getByRole("checkbox", { name: new RegExp(name) }).check();
  await expect(result).toContainText("最高得点");
  await page.getByRole("slider", { name: "積載量" }).press("ArrowLeft");
  await expect(result).toContainText("1 kg超過");
  await inspect(page).click();
  expect(JSON.parse(await page.locator("#lessonInput").inputValue()).capacity).toBe(9);
  await page.locator("#traceEnd").click();
  await expect(page.locator("#answer")).toHaveText("20");
  await page.goBack();
  await expect(result).toContainText("1 kg超過");
});

test("edit, reject, remove and add reservations and inspect the exact schedule", async ({ page }) => {
  await page.goto("/#learn/interval");
  await page.getByRole("link", { name: "ミニアプリで試す" }).click();
  const result = page.locator(".applied-result");
  await expect(result).toContainText("3 / 5件");
  const start = page.getByRole("spinbutton", { name: "予約1 開始時刻" });
  await start.fill("12");
  await expect(result).toContainText("終了は開始より後");
  await expect(inspect(page)).toBeDisabled();
  await page.getByRole("button", { name: "予約1を削除" }).click();
  await page.getByRole("button", { name: "予約を追加" }).click();
  await expect(result).toContainText("4 / 5件");
  await inspect(page).click();
  const data = JSON.parse(await page.locator("#lessonInput").inputValue());
  expect(data.intervals).toEqual([[9,10],[10,11],[11,13],[12,14],[13,14]]);
  await page.locator("#traceEnd").click();
  await expect(page.locator("#answer")).toHaveText("[[9,10],[10,11],[11,13],[13,14]]");
});

test("change a line cost and isolate a station", async ({ page }) => {
  await page.goto("/#apply/kruskal");
  const result = page.locator(".applied-result");
  await expect(result).toContainText("9万円");
  await page.getByRole("spinbutton", { name: "本部 ↔ 集落の敷設費" }).fill("1");
  await expect(result).toContainText("6万円");
  await page.getByRole("checkbox", { name: "本部 ↔ 集落" }).uncheck();
  await page.getByRole("checkbox", { name: "本部 ↔ 診療所" }).uncheck();
  await expect(result).toContainText("すべての拠点をつなげません");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await inspect(page).click();
  await page.locator("#traceEnd").click();
  await expect(page.locator("#answer")).toHaveText("null");
});
