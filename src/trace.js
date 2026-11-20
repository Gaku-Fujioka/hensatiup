export function requireInput(ok, message) {
  if (!ok) throw new Error(message);
}

export function integers(values, name = "values", min = -99, max = 99, limit = 16) {
  requireInput(Array.isArray(values) && values.length <= limit &&
    values.every(n => Number.isInteger(n) && n >= min && n <= max),
    name + " は " + min + "〜" + max + " の整数を" + limit + "個まで指定してください。");
}
export function integer(n, name, min, max) {
  requireInput(Number.isInteger(n) && n >= min && n <= max, name + " は " + min + "〜" + max + " の整数です。");
}

export function runLesson(lesson, input) {
  requireInput(input && typeof input === "object" && !Array.isArray(input), "入力はJSONオブジェクトにしてください。");
  lesson.validate(input);
  const frames = [];
  const source = lesson.solve.toString().split("\n");
  function observe(action, state, active = []) {
    const line = source.findIndex(text => text.includes('observe("' + action + '"'));
    frames.push({ action, state: structuredClone(state), active: [...active], line });
  }
  const answer = lesson.solve(structuredClone(input), observe);
  return { source, frames: [
    { action: "入力", state: structuredClone(input), active: [], line: 0 },
    ...frames, { action: "結果", state: { answer }, active: [], line: -1 }
  ], answer, comparisons: frames.filter(frame => frame.action.startsWith("比較")).length };
}
