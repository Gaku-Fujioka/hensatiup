import test from "node:test";
import assert from "node:assert/strict";
import { missions, compileRule, grade } from "../src/missions.js";

test("arithmetic honours precedence and parentheses", () => {
  const n = { g: 2, h: 3, steps: 5 };
  assert.equal(compileRule("steps + 2 * g")(n), 9);
  assert.equal(compileRule("(steps + 2) * g")(n), 14);
});
test("unknown names, unbalanced and trailing tokens are rejected", () => {
  for (const expr of [
    "",
    "g(",
    "g h",
    "(h+1",
    "g()",
    "steps;",
    "2 ** h",
    "1001",
  ])
    assert.throws(() => compileRule(expr));
});
test("reference rules pass the three delivery challenges", () => {
  for (const m of missions)
    assert.ok(grade(m, compileRule(m.example)).every((r) => r.pass));
});
test("minimising hops fails fuel, and ignoring the estimate misses the search budget", () => {
  assert.ok(grade(missions[1], compileRule("steps")).some((r) => !r.pass));
  assert.ok(grade(missions[2], compileRule("g")).some((r) => !r.pass));
});
