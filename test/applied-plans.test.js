import test from "node:test";
import assert from "node:assert/strict";
import { catalog } from "../src/catalog.js";
import { runLesson } from "../src/trace.js";
import { useCases } from "../src/use-cases.js";
import { planCargo, planNetwork, planReservations } from "../src/applied-plans.js";

test("every practical example is searchable and executable by its lesson", () => {
  assert.deepEqual(Object.keys(useCases).sort(), catalog.map((lesson) => lesson.id).sort());
  for (const lesson of catalog) {
    const scenario = useCases[lesson.id];
    assert.ok(scenario.title && scenario.description);
    const trace = runLesson(lesson, scenario.input);
    assert.deepEqual(trace.frames[0].state, scenario.input);
    assert.notEqual(trace.answer, undefined);
  }
});

test("cargo recommendations are feasible optimal subsets, including ties and empty loads", () => {
  for (const { weights, profits } of [useCases.knapsack.input, { weights: [2, 2, 4], profits: [3, 3, 6] }, { weights: [], profits: [] }]) {
    for (let capacity = 0; capacity <= 24; capacity++) {
      let expected = 0;
      for (let mask = 0; mask < 2 ** weights.length; mask++) {
        let weight = 0, score = 0;
        for (let i = 0; i < weights.length; i++) {
          if ((mask & (1 << i)) === 0) continue;
          weight += weights[i];
          score += profits[i];
        }
        if (weight <= capacity) expected = Math.max(expected, score);
      }
      const plan = planCargo({ weights, profits, capacity });
      assert.equal(plan.score, expected);
      assert.equal(new Set(plan.picked).size, plan.picked.length);
      assert.equal(plan.picked.reduce((sum, i) => sum + weights[i], 0), plan.weight);
      assert.equal(plan.picked.reduce((sum, i) => sum + profits[i], 0), expected);
      assert.ok(plan.weight <= capacity);
    }
  }
});

test("the booking schedule identifies accepted requests even when time slots repeat", () => {
  assert.deepEqual(planReservations(useCases.interval.input), [1, 2, 3]);
  assert.deepEqual(planReservations({ intervals: [[8, 9], [8, 9], [9, 12]] }), [0, 2]);
  assert.deepEqual(planReservations({ intervals: [] }), []);
});

test("network plans distinguish a disconnected forest from a free connected network", () => {
  assert.deepEqual(planNetwork(useCases.kruskal.input), { cost: 9, chosen: [[1, 2], [2, 3], [0, 1]] });
  assert.deepEqual(planNetwork({ n: 3, edges: [[0, 1, 2]] }), { cost: null, chosen: [[0, 1]] });
  assert.deepEqual(planNetwork({ n: 2, edges: [[0, 1, 0]] }), { cost: 0, chosen: [[0, 1]] });
});
