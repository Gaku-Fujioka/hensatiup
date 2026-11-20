import { test, expect } from "@playwright/test";
import { maps } from "../src/maps.js";
import { explore, rules } from "../src/search.js";

async function cell(page, map, index, touch = false) {
  const canvas = page.locator("#map");
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  const x = box.x + (((index % map.cols) + 0.5) * box.width) / map.cols;
  const y = box.y + ((Math.floor(index / map.cols) + 0.5) * box.height) / map.rows;
  if (touch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

test("draw, compare, retry and record the most economical delivery", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#lab");
  await expect(page.locator("#launch")).toBeDisabled();
  const map = maps[0];
  await cell(page, map, map.start - map.cols);
  await expect(page.locator("#routeNotice")).toContainText("通れません");
  await cell(page, map, map.goal);
  await expect(page.locator("#usedFuel")).toHaveText("33");
  await page.locator("#launch").click();
  await page.locator("#launch").click();
  await expect(page.locator("#launch")).toHaveText("走行を再開");
  await page.locator("#launch").click();
  await page.locator("#skipRace").click();
  await expect(page.locator("#deliveryStats")).toContainText("12歩・燃料33 ／ ダイクストラ法 22歩・燃料22");
  await expect(page.locator("#bestFuel")).toHaveText("33");
  await page.locator("#launch").click();
  await page.locator("#clearWay").click();
  const path = explore(map, rules.dijkstra).path;
  const board = page.locator("#map");
  await board.focus();
  for (let i = 1; i < path.length; i++) {
    const d = path[i] - path[i - 1];
    await board.press(d === 1 ? "ArrowRight" : d === -1 ? "ArrowLeft" : d > 0 ? "ArrowDown" : "ArrowUp");
  }
  await page.locator("#launch").click();
  await page.locator("#skipRace").click();
  await expect(page.locator("#deliveryTitle")).toHaveText("目標燃料で配送成功！");
  await page.reload();
  await expect(page.locator("#bestFuel")).toHaveText("22");
  await expect(page.locator(".stamp-log .earned")).toHaveText("✓ 川辺");
  expect(errors).toEqual([]);
});

test.describe("mobile expedition", () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 812 }, reducedMotion: "reduce" });
  test("tap routes and switch region without carrying over a result", async ({ page }) => {
    await page.goto("/#lab");
    await cell(page, maps[0], maps[0].goal, true);
    await page.locator("#undoWay").click();
    await expect(page.locator("#launch")).toBeDisabled();
    await cell(page, maps[0], maps[0].goal, true);
    await page.locator("#launch").click();
    await expect(page.locator("#raceReport")).toBeVisible();
    await page.locator("#preset").selectOption("daily");
    await expect(page.locator("#dispatchBrief")).toContainText("本日の補給要請");
    await expect(page.locator("#raceReport")).toBeHidden();
    await expect(page.locator("#routeSteps")).toHaveText("0");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    expect((await page.request.get("/assets/rescue-valley.jpg")).headers()["content-type"]).toContain(
      "image/jpeg",
    );
  });
});

test("a vehicle naturally reaches an edited goal without filing an official record", async ({ page }) => {
  await page.goto("/#lab");
  await page.getByRole("button", { name: "地図を編集" }).click();
  await page.getByRole("button", { name: "目的地", exact: true }).click();
  await cell(page, maps[0], maps[0].start + 1);
  await page.locator("#rescueMode").click();
  await expect(page.locator("#bestFuel")).toHaveText("訓練走行");
  const board = page.locator("#map");
  await board.scrollIntoViewIfNeeded();
  const box = await board.boundingBox();
  const x = box.x + 1.5 * box.width / 15, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + box.width / 15, y, {steps: 4});
  await page.mouse.up();
  await expect(page.locator("#routeSteps")).toHaveText("1");
  await page.locator("#launch").click();
  await expect(page.locator("#deliveryStats")).toContainText("1歩・燃料1");
  expect(await page.evaluate(() => localStorage.getItem("routelab.rescue.records.v1"))).toBeNull();
});
