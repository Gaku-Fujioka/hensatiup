import { test, expect } from "@playwright/test";

test("a learner filters lessons, runs custom input and inspects the actual implementation", async ({
  page,
}) => {
  await page.goto("/#library");
  await page.getByRole("searchbox").fill("二分探索");
  await page.locator("#lessonGroup").selectOption("配列と探索");
  await expect(page.locator(".lesson-card")).toHaveCount(1);
  await page.locator(".lesson-card").click();
  await expect(page.locator("#lessonSource")).toContainText("function binarySearch");
  await page.locator("#lessonInput").fill('{"values":[2,4,6],"target":6}');
  await page.getByRole("button", { name: "この入力で実行" }).click();
  await page.locator("#traceNext").click();
  await expect(page.locator(".source-row.current")).toContainText("中央の値と照合");
  await page.locator("#traceEnd").click();
  await expect(page.locator("#answer")).toHaveText("2");
  await page.locator("#lessonInput").fill('{"values":[9,1],"target":9}');
  await page.getByRole("button", { name: "この入力で実行" }).click();
  await expect(page.getByRole("alert")).toContainText("昇順");
  await page.goBack();
  await expect(page.locator("#findLesson")).toHaveValue("二分探索");
});
