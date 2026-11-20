import test from "node:test";
import assert from "node:assert/strict";
import { drills, checkDrill } from "../src/drills.js";
import { compileExpression } from "../src/expressions.js";
import { compileRule } from "../src/missions.js";

for (const drill of drills)
  test(drill.id + " evaluates expressions by output", () => {
    assert.ok(checkDrill(drill, drill.answer).every((row) => row.passed));
    assert.ok(checkDrill(drill, "0").some((row) => !row.passed));
  });
test("equivalent expressions, precedence, invalid syntax and non-progressing loops", () => {
  const run = (s) => compileExpression(s, ["x"])({ x: 4 });
  assert.equal(run("Math.max(-1, x*2-3, 1)"), 5);
  assert.equal(run("2 + 3 * 4 >= 14"), true);
  assert.equal(run("9 % 4 + 4 / 2"), 3);
  for (const s of ["unknown", "x.toString()", "Math.min(2,)", "01", "x; x", "x +"])
    assert.throws(() => run(s));
  for (const s of ["g - h", "g / h", "Math.min(g,h)", "-1"]) assert.throws(() => compileRule(s));
  assert.ok(checkDrill(drills[0], "left").some((r) => r.error));
  assert.ok(
    checkDrill(
      drills.find((d) => d.id === "window"),
      "incoming + sum - outgoing",
    ).every((r) => r.passed),
  );
});
