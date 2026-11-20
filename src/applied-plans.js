import { catalog } from "./catalog.js";
import { runLesson } from "./trace.js";

function run(id, input) {
  return runLesson(catalog.find((lesson) => lesson.id === id), input);
}

export function planCargo(input) {
  const { answer, frames } = run("knapsack", input);
  const picked = [];
  let remaining = input.capacity;
  // Read decisions backwards: after taking item i only decisions from earlier items apply.
  for (let i = frames.length - 2; i > 0; i--) {
    const { item, space, take } = frames[i].state;
    if (take && space === remaining) {
      picked.unshift(item);
      remaining -= input.weights[item];
    }
  }
  return { score: answer, weight: input.capacity - remaining, picked };
}

export function planReservations(input) {
  const { answer } = run("interval", input);
  // Equal nonempty time slots overlap. Stable sorting gives the first request the slot.
  return answer.map(([start, end]) => input.intervals.findIndex(([a, b]) => a === start && b === end));
}

export function planNetwork(input) {
  const { answer, frames } = run("kruskal", input);
  const chosen = frames.findLast((frame) => frame.state.chosen)?.state.chosen ?? [];
  return { cost: answer, chosen };
}
