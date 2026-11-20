import { neighbours, TERRAIN } from "./maps.js";
import { HeapFrontier } from "./frontier.js";

export const rules = {
  bfs: ({ steps }) => steps,
  dijkstra: ({ g }) => g,
  astar: ({ g, h }) => g + h,
};

function distance(map, i) {
  return (
    Math.abs((i % map.cols) - (map.goal % map.cols)) +
    Math.abs(Math.floor(i / map.cols) - Math.floor(map.goal / map.cols))
  );
}

export function explore(map, priority, Frontier = HeapFrontier) {
  const { start, goal } = map;
  const origin = {
    cell: start,
    g: 0,
    steps: 0,
    h: distance(map, start),
    parent: null,
  };
  const queue = new Frontier();
  queue.offer({ ...origin, score: priority(origin) });
  const visited = new Set();
  const frames = [{ current: null, frontier: [start], added: [], cost: 0, comparisons: 0 }];
  while (queue.size) {
    const next = queue.take();
    visited.add(next.cell);
    const added = [];
    if (next.cell !== goal) {
      for (const cell of neighbours(map, next.cell)) {
        if (visited.has(cell)) continue;
        const node = {
          cell,
          g: next.g + TERRAIN[map.cells[cell]].cost,
          steps: next.steps + 1,
          h: distance(map, cell),
          parent: next,
        };
        if (queue.offer({ ...node, score: priority(node) })) added.push(cell);
      }
    }
    frames.push({
      current: next.cell,
      frontier: [...queue.cells()],
      added,
      cost: next.g,
      comparisons: queue.comparisons,
    });
    if (next.cell === goal) {
      const path = [];
      for (let p = next; p; p = p.parent) path.push(p.cell);
      return {
        frames,
        visited: visited.size,
        path: path.reverse(),
        cost: next.g,
        steps: next.steps,
      };
    }
  }
  return { frames, visited: visited.size, path: [], cost: null, steps: null };
}
