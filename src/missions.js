import { maps } from "./maps.js";
import { explore, rules } from "./search.js";

export const missions = [
  {
    name: "最短歩数で届ける",
    map: "river",
    target: "bfs",
    task: "平地も砂地も同じ1歩。3つの配達先すべてに、最少の歩数で到着してください。",
    hint: "次の候補までに何歩進んだかを使います。",
    example: "steps",
  },
  {
    name: "配送コストを節約",
    map: "sand",
    target: "dijkstra",
    task: "砂地を通ると燃料を4消費します。3つの地図すべてで、合計コストを最小にしてください。",
    hint: "候補までに使ったコストが小さいマスから調べてみましょう。",
    example: "g",
  },
  {
    name: "探索マスを削減",
    map: "pass",
    target: "astar",
    task: "最小コストを保ったまま、3つの地図それぞれで探索マス数をA*の見本以下に抑えてください。",
    hint: "今までに使ったコストと、これから必要なコストの見積もりを足します。",
    example: "g + h",
  },
];

// Deliberately small arithmetic language. Only the three displayed inputs are bound.
export function compileRule(source) {
  const input = source.trim();
  if (!input || input.length > 100)
    throw new Error("1〜100文字で優先順位の式を入力してください。");
  const tokens = input.match(/\d+(?:\.\d+)?|[a-zA-Z]+|[^\s]/g);
  let index = 0;
  function atom() {
    const token = tokens[index++];
    if (token === "(") {
      const f = sum();
      if (tokens[index++] !== ")") throw new Error("括弧を閉じてください。");
      return f;
    }
    if (["g", "h", "steps"].includes(token)) return (node) => node[token];
    if (/^\d+(?:\.\d+)?$/.test(token)) {
      const n = Number(token);
      if (n > 1000) throw new Error("数値は0〜1000を使ってください。");
      return () => n;
    }
    throw new Error("使えるのは g、h、steps、数値、+、*、括弧です。");
  }
  function product() {
    let f = atom();
    while (tokens[index] === "*") {
      index++;
      const left = f,
        right = atom();
      f = (node) => left(node) * right(node);
    }
    return f;
  }
  function sum() {
    let f = product();
    while (tokens[index] === "+") {
      index++;
      const left = f,
        right = product();
      f = (node) => left(node) + right(node);
    }
    return f;
  }
  const rule = sum();
  if (index !== tokens.length)
    throw new Error("項と項の間には + または * を置いてください。");
  return rule;
}

export function grade(mission, rule) {
  return maps.map((map) => {
    const expected = explore(map, rules[mission.target]);
    const actual = explore(map, rule);
    const metric = mission.target === "bfs" ? "steps" : "cost";
    const pass =
      actual[metric] === expected[metric] &&
      (mission.target !== "astar" || actual.visited <= expected.visited);
    return { map, actual, expected, pass };
  });
}
