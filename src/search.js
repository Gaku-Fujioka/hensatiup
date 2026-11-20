import { neighbours, TERRAIN } from './maps.js';

export const rules = {
  bfs: ({ steps }) => steps,
  dijkstra: ({ g }) => g,
  astar: ({ g, h }) => g + h
};

function distance(map, i) {
  return Math.abs(i % map.cols - map.goal % map.cols)
    + Math.abs(Math.floor(i / map.cols) - Math.floor(map.goal / map.cols));
}

// A fixed 15 × 9 teaching board favours an inspectable, stable queue.
// The trace records exactly what the player saw after each expansion.
export function explore(map, priority) {
  const { start, goal } = map;
  const origin = { cell: start, g: 0, steps: 0, h: distance(map, start), parent: null };
  const queue = new Map([[start, { ...origin, score: priority(origin) }]]);
  const visited = new Set();
  const frames = [{ current: null, frontier: [start], added: [], cost: 0 }];
  while (queue.size) {
    let next;
    for (const node of queue.values()) {
      if (!next || node.score < next.score) next = node;
    }
    queue.delete(next.cell);
    visited.add(next.cell);
    const added = [];
    if (next.cell !== goal) {
      for (const cell of neighbours(map, next.cell)) {
        if (visited.has(cell)) continue;
        const node = { cell, g: next.g + TERRAIN[map.cells[cell]].cost, steps: next.steps + 1,
          h: distance(map, cell), parent: next };
        const score = priority(node);
        if (queue.has(cell) && queue.get(cell).score <= score) continue;
        queue.set(cell, { ...node, score });
        added.push(cell);
      }
    }
    frames.push({ current: next.cell, frontier: [...queue.keys()], added, cost: next.g });
    if (next.cell === goal) {
      const path = [];
      for (let p = next; p; p = p.parent) path.push(p.cell);
      return { frames, visited: visited.size, path: path.reverse(), cost: next.g, steps: next.steps };
    }
  }
  return { frames, visited: visited.size, path: [], cost: null, steps: null };
}
