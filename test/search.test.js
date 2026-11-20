import test from "node:test";
import assert from "node:assert/strict";
import { maps, neighbours, TERRAIN } from "../src/maps.js";
import { explore, rules } from "../src/search.js";

for (const map of maps) {
  test(map.name + " has legal paths and equivalent optimal costs", () => {
    const results = Object.values(rules).map((rule) => explore(map, rule));
    assert.equal(map.cells.length, map.cols * map.rows);
    for (const { path, frames, visited, cost } of results) {
      assert.equal(path[0], map.start);
      assert.equal(path.at(-1), map.goal);
      assert.equal(frames.length, visited + 1);
      let total = 0;
      path.slice(1).forEach((cell, i) => {
        assert.ok(neighbours(map, path[i]).includes(cell));
        total += TERRAIN[map.cells[cell]].cost;
      });
      assert.equal(total, cost);
      assert.equal(
        new Set(frames.slice(1).map((f) => f.current)).size,
        visited,
      );
    }
    assert.equal(results[1].cost, results[2].cost);
    assert.ok(results[0].steps <= results[1].steps);
  });
}
test("an extra two moves can avoid a costly direct route", () => {
  const map = { cols: 3, rows: 2, cells: [...".:...."], start: 0, goal: 2 };
  assert.equal(explore(map, rules.bfs).cost, 5);
  assert.equal(explore(map, rules.astar).cost, 4);
});
test("wall between rows cannot be bypassed by wrapping", () => {
  for (const priority of Object.values(rules)) {
    const result = explore(
      { cols: 2, rows: 2, cells: [..."#..#"], start: 1, goal: 2 },
      priority,
    );
    assert.deepEqual(result.path, []);
    assert.equal(result.cost, null);
    assert.deepEqual(result.frames.at(-1).frontier, []);
  }
});
