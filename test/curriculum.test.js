import test from "node:test";
import assert from "node:assert/strict";
import { catalog } from "../src/catalog.js";
import { questions } from "../src/study-tools.js";
import { runLesson } from "../src/trace.js";

test("every catalog lesson has a unique link, working example, question and source locations", () => {
  assert.equal(new Set(catalog.map((l) => l.id)).size, catalog.length);
  for (const lesson of catalog) {
    const [question, options, correct, why] = questions[lesson.id];
    assert.ok(question && options[correct] && why);
    const result = runLesson(lesson, lesson.example);
    for (const f of result.frames.slice(1, -1)) assert.match(result.source[f.line], /observe\(/, lesson.id);
  }
});
test("comparison counts are value comparisons, independent of trace verbosity", () => {
  const run = (id, values) =>
    runLesson(
      catalog.find((l) => l.id === id),
      { values },
    ).comparisons;
  assert.equal(run("bubble", [1, 2, 3, 4]), 3);
  assert.equal(run("selection", [1, 2, 3, 4]), 6);
  assert.equal(run("insertion", [4, 3, 2, 1]), 6);
});
