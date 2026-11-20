import test from "node:test";
import assert from "node:assert/strict";
import { maps } from "../src/maps.js";
import {
  extendRoute,
  itinerary,
  positionAt,
  isOfficial,
  fileDelivery,
  loadRecords,
} from "../src/expedition.js";
const river = maps[0];

test("straight routes include all intermediate costs and can be rewound", () => {
  const { route } = extendRoute(river, [river.start], river.goal);
  const trip = itinerary(river, route);
  assert.equal(trip.fuel, 33);
  assert.equal(trip.steps, 12);
  assert.deepEqual(extendRoute(river, route, route[2]).route, route.slice(0, 3));
  assert.deepEqual(positionAt(trip, trip.fuel + 2, river), { x: 13, y: 4 });
  const i = route.findIndex((c) => river.cells[c] === ":");
  const half = trip.times[i] - 2;
  assert.equal(positionAt(trip, half, river).x, (route[i] % river.cols) - 0.5);
});
test("walls, diagonals and row wrapping never produce a partial path", () => {
  for (const cell of [river.start - 15, river.goal + 1 - 15, 60]) {
    const from = cell === 60 ? [59] : [river.start];
    const attempt = extendRoute(river, from, cell);
    assert.deepEqual(attempt.route, from);
    assert.ok(attempt.notice);
  }
});
test("best fuel persists for original assignments only", () => {
  const storage = {
    data: null,
    setItem(k, v) {
      this.data = v;
    },
    getItem() {
      return this.data;
    },
  };
  const best = fileDelivery({}, river, 22, storage);
  assert.deepEqual(loadRecords(storage), { river: 22 });
  assert.deepEqual(fileDelivery(best, river, 33, storage), best);
  const edited = structuredClone(river);
  edited.cells[0] = ":";
  assert.equal(isOfficial(edited), false);
  assert.deepEqual(fileDelivery(best, edited, 12, storage), best);
});

test("daily expeditions reproduce a board and always offer an affordable detour", async () => {
  const { makeDailyMap } = await import("../src/daily-map.js");
  const { explore, rules } = await import("../src/search.js");
  const seen = new Set();
  for (let i = 1; i <= 28; i++) {
    const day = "2026-11-" + String(i).padStart(2, "0"),
      map = makeDailyMap(day);
    assert.deepEqual(map, makeDailyMap(day));
    assert.ok(isOfficial(map));
    assert.ok(explore(map, rules.dijkstra).cost <= 20);
    assert.ok(explore(map, rules.bfs).cost > 20);
    seen.add(map.cells.join(""));
  }
  assert.equal(seen.size, 28);
});
