import test from "node:test";
import assert from "node:assert/strict";
import { HeapFrontier, LinearFrontier } from "../src/frontier.js";
import { maps } from "../src/maps.js";
import { makeDailyMap } from "../src/daily-map.js";
import { explore, rules } from "../src/search.js";

for (const Frontier of [HeapFrontier, LinearFrontier]) {
  test(Frontier.name + " keeps the discovery order on ties and replaces only better candidates", () => {
    const queue = new Frontier();
    for (const [cell, score] of [[0, 6], [1, 5], [2, 3], [3, 5]]) queue.offer({ cell, score });
    assert.equal(queue.offer({ cell: 1, score: 5 }), false);
    assert.equal(queue.offer({ cell: 2, score: 9 }), false);
    assert.equal(queue.offer({ cell: 0, score: 3, parent: 2 }), true);
    assert.deepEqual([...queue.cells()], [0, 1, 2, 3]);
    const first = queue.take();
    assert.equal(first.cell, 0);
    assert.equal(first.parent, 2);
    queue.offer({ cell: 0, score: 5 });
    assert.deepEqual([...queue.cells()], [1, 2, 3, 0]);
    assert.deepEqual(Array.from({ length: 4 }, () => queue.take().cell), [2, 1, 3, 0]);
    assert.equal(queue.take(), undefined);
    assert.equal(queue.size, 0);
  });
}

test("queue counters measure ordering on insertion and extraction", () => {
  const heap = new HeapFrontier();
  const scan = new LinearFrontier();
  for (const queue of [heap, scan]) {
    for (const score of [3, 2, 1]) queue.offer({ cell: score, score });
  }
  assert.equal(heap.comparisons, 2);
  assert.equal(scan.comparisons, 0);
  for (const queue of [heap, scan]) {
    queue.offer({ cell: 2, score: 2 });
    queue.take();
  }
  assert.equal(heap.comparisons, 3);
  assert.equal(scan.comparisons, 2);
});

test("switching the frontier preserves every search frame for the lab and custom delivery rules", () => {
  const daily = Array.from({ length: 28 }, (_, i) => makeDailyMap("2026-11-" + String(i + 1).padStart(2, "0")));
  const edited = structuredClone(maps[0]);
  edited.cells[edited.start + 1] = "#";
  const blocked = { rows: 1, cols: 3, start: 0, goal: 2, cells: [".", "#", "."] };
  const sameCell = { ...blocked, goal: 0 };
  const priorities = [...Object.values(rules), () => 0, ({ steps, h }) => steps + 5 * h];
  for (const map of [...maps, ...daily, edited, blocked, sameCell]) {
    for (const priority of priorities) {
      const heap = explore(map, priority);
      const scan = explore(map, priority, LinearFrontier);
      for (const result of [heap, scan]) {
        let previousCount = 0;
        result.frames = result.frames.map(({ comparisons, ...frame }) => {
          assert.ok(comparisons >= previousCount);
          previousCount = comparisons;
          return frame;
        });
      }
      assert.deepEqual(heap, scan);
    }
  }
});
