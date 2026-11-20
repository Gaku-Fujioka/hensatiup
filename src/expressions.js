const operators = new Map([
  ["===", [1, (a, b) => a === b]],
  ["!==", [1, (a, b) => a !== b]],
  ["<", [2, (a, b) => a < b]],
  ["<=", [2, (a, b) => a <= b]],
  [">", [2, (a, b) => a > b]],
  [">=", [2, (a, b) => a >= b]],
  ["+", [3, (a, b) => a + b]],
  ["-", [3, (a, b) => a - b]],
  ["*", [4, (a, b) => a * b]],
  ["/", [4, (a, b) => a / b]],
  ["%", [4, (a, b) => a % b]],
]);

// Parse only the displayed expression grammar. No program execution or global references.
export function compileExpression(source, names, { basic = false } = {}) {
  const input = source.trim();
  const limit = basic ? 100 : 140;
  if (!input || input.length > limit) throw new Error("1〜" + limit + "文字の式を入力してください。");
  const tokens = input.match(/Math\.(?:min|max)\b|===|!==|>=|<=|\+\+|--|[a-zA-Z_]\w*|\d+(?:\.\d+)?|[^\s]/g);
  let index = 0;
  const invalid = () => new Error("使えるのは " + names.join("、") + " と、案内にある演算・数値・括弧です。");
  function expect(token) {
    if (tokens[index++] !== token) throw new Error(token + " の位置を確認してください。");
  }
  function atom() {
    const token = tokens[index++];
    if (token === "(") {
      const expr = parse(1);
      expect(")");
      return expr;
    }
    if (!basic && token === "-") {
      const expr = atom();
      return (vars) => -expr(vars);
    }
    if (!basic && (token === "Math.min" || token === "Math.max")) {
      const fn = token === "Math.min" ? Math.min : Math.max;
      expect("(");
      const args = [parse(1)];
      while (tokens[index] === ",") {
        index++;
        args.push(parse(1));
      }
      expect(")");
      return (vars) => fn(...args.map((arg) => arg(vars)));
    }
    if (names.includes(token)) return (vars) => vars[token];
    if ((basic ? /^\d+(?:\.\d+)?$/ : /^(0|[1-9]\d*)(?:\.\d+)?$/).test(token)) {
      const number = Number(token);
      if (number > 1000) throw new Error("数値は0〜1000の範囲で指定してください。");
      return () => number;
    }
    throw invalid();
  }
  function parse(minimum) {
    let expr = atom();
    while (index < tokens.length) {
      const token = tokens[index],
        entry = operators.get(token);
      if (!entry || entry[0] < minimum) break;
      if (basic && token !== "+" && token !== "*") throw invalid();
      index++;
      const left = expr,
        right = parse(entry[0] + 1),
        operation = entry[1];
      expr = (vars) => operation(left(vars), right(vars));
    }
    return expr;
  }
  const expression = parse(1);
  if (index !== tokens.length) throw invalid();
  return expression;
}
