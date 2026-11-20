import test from "node:test";
import assert from "node:assert/strict";
import { maps } from "../src/maps.js";
import { makeDailyMap } from "../src/daily-map.js";
import { bestStars, fileMedal, itinerary, loadMedals } from "../src/expedition.js";
import { markersReached, missionMarkers, missionObjectives } from "../src/quest.js";
import { explore, rules } from "../src/search.js";

test("all three stars are attainable together on every type of contract", () => {
  const daily = Array.from({ length: 28 }, (_, i) => makeDailyMap("2026-11-" + String(i + 1).padStart(2, "0")));
  for (const map of [...maps, ...daily]) {
    const path = explore(map, rules.dijkstra).path;
    const markers = missionMarkers(map, path);
    const goals = missionObjectives(map, itinerary(map, path), markers);
    assert.deepEqual(goals.map((goal) => goal.met), [true, true, true], map.id);
    assert.ok(markers.every((cell) => cell !== map.start && cell !== map.goal));
  }
});

test("a direct delivery can miss both bonus stars, and an unfinished route earns no delivery", () => {
  for (const map of maps.slice(0, 2)) {
    const direct = explore(map, rules.bfs).path;
    const markers = missionMarkers(map, explore(map, rules.dijkstra).path);
    const goals = (path) => missionObjectives(map, itinerary(map, path), markers).map((goal) => goal.met);
    assert.deepEqual(goals(direct), [true, false, false]);
    assert.deepEqual(goals(direct.slice(0, -1)), [false, false, false]);
  }
});

test("relays must be activated in order and rewinding the route removes the activation", () => {
  const markers = missionMarkers(maps[2], []);
  assert.equal(markersReached(markers, [...markers].reverse()), 1);
  assert.equal(markersReached(markers, markers), 2);
  assert.equal(markersReached(markers, markers.slice(0, 1)), 1);
});

test("the log keeps the highest single-run medal and credits proven legacy achievements", () => {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
  assert.equal(bestStars({}, { river: 33 }, "river", 28), 1);
  assert.equal(bestStars({}, { river: 22 }, "river", 28), 2);
  fileMedal({}, maps[0], 3, storage);
  assert.deepEqual(fileMedal({}, maps[0], 1, storage), { river: 3 });
  const edited = { ...maps[1], goal: maps[1].start + 1 };
  fileMedal({}, edited, 3, storage);
  fileMedal({}, makeDailyMap("2026-11-21"), 2, storage);
  fileMedal({}, makeDailyMap("2026-11-20"), 3, storage);
  assert.deepEqual(loadMedals(storage), { river: 3, "daily-2026-11-21": 2 });
  assert.deepEqual(fileMedal({}, maps[1], 1, undefined), { sand: 1 });
});
