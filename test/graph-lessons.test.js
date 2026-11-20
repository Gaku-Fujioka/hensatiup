import test from "node:test";
import assert from "node:assert/strict";
import { graphLessons } from "../src/graph-lessons.js";
import { runLesson } from "../src/trace.js";
function execute(id, input) {
  const l = graphLessons.find((l) => l.id === id);
  return runLesson(l, input ?? l.example).answer;
}
const expected = {
  bfs: [0, 1, 2, 3, 4, 5],
  dfs: [0, 1, 3, 5, 2, 4],
  topological: [0, 1, 2, 3, 4, 5],
  dijkstra: 6,
  astar: 4,
  inorder: [1, 3, 4, 5, 7, 8, 9],
  stack: true,
  hash: [
    [4, 3],
    [2, 2],
    [7, 1],
  ],
  union: 3,
  interval: [
    [1, 3],
    [3, 4],
    [4, 6],
  ],
  kruskal: 6,
};
for (const [id, result] of Object.entries(expected))
  test(id + " example", () => assert.deepEqual(execute(id), result));
test("cycles, unreachable goals, disconnected networks and non-nesting pairs", () => {
  assert.equal(
    execute("topological", {
      n: 2,
      edges: [
        [0, 1],
        [1, 0],
      ],
    }),
    null,
  );
  assert.equal(execute("dijkstra", { n: 2, edges: [], start: 0, goal: 1 }), null);
  assert.equal(execute("astar", { grid: [".#."], start: 0, goal: 2 }), null);
  assert.equal(execute("kruskal", { n: 2, edges: [] }), null);
  assert.equal(execute("stack", { text: "([)]" }), false);
  assert.throws(() => execute("dijkstra", { n: 2, edges: [[0, 1, -1]], start: 0, goal: 1 }), /重み/);
  assert.deepEqual(execute("dfs", { n: 2, edges: [[0, 0]], start: 0 }), [0]);
});
