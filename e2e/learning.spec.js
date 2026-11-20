import { test, expect } from "@playwright/test";

test("algorithm selection, trace seeking, playback, predictions and map editing", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#lab");
  const status = page.locator("#status");
  await page.getByRole("button", { name: /A\* 探索/ }).click();
  await page.getByRole("button", { name: "1ステップ進む" }).click();
  await expect(page.locator("#step")).toContainText("1 /");
  await page.locator("#seek").focus();
  await page.keyboard.press("End");
  await expect(status).toHaveText("到着");
  await expect(page.locator("#narration")).toContainText("合計コストは22");
  await page.getByRole("button", { name: "先頭に戻る" }).click();
  await page.locator("#play").click();
  await expect(page.locator("#step")).not.toHaveText(/^0 \/ /);
  await page.locator("#play").click();
  await expect(status).toHaveText("一時停止");
  await page.getByRole("button", { name: "目的地までの縦横の距離" }).click();
  await expect(page.getByRole("status")).toContainText("正解");
  await page.getByRole("button", { name: "地図を編集" }).click();
  await page.getByRole("button", { name: "森", exact: true }).click();
  await page.locator("#map").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page.locator("#cellInfo")).toContainText("C5 森");
  await expect(
    page.locator("tbody tr").first().locator("td").nth(1),
  ).not.toHaveText("12");
  await page.getByRole("button", { name: "元の地形に戻す" }).click();
  await expect(
    page.locator("tbody tr").first().locator("td").nth(1),
  ).toHaveText("12");
  expect(errors).toEqual([]);
});

test("delivery attempts are graded and progress survives a reload", async ({
  page,
}) => {
  await page.goto("/#mission");
  await page.getByRole("button", { name: "配送コストを節約" }).click();
  const field = page.locator("#expr");
  const submit = page.getByRole("button", { name: "配送を実行" });
  await field.fill("g +");
  await submit.click();
  await expect(page.getByRole("status")).toContainText("使えるのは");
  await field.fill("steps");
  await submit.click();
  await expect(page.getByRole("status")).toContainText("0 / 3");
  await field.fill("g");
  await submit.click();
  await expect(page.getByRole("status")).toContainText("達成！");
  await expect(page.locator("#narration")).toContainText("目的地 G に到着");
  await expect(page.locator("#progress")).toHaveText("1 / 3");
  await page.reload();
  await expect(page.locator("#progress")).toHaveText("1 / 3");
  await page.getByRole("link", { name: "探索ラボ", exact: true }).click();
  await expect(page.locator("#preset")).toBeEnabled();
});

test("a narrow screen preserves the board and mission controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const hash of ["lab", "mission"]) {
    await page.goto("/#" + hash);
    await expect(page.locator("#map")).toBeVisible();
    const width = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(width).toBeLessThanOrEqual(375);
  }
  await page.locator("#expr").fill("steps");
  await page.getByRole("button", { name: "配送を実行" }).click();
  await expect(page.getByRole("status")).toContainText("達成！");
});
