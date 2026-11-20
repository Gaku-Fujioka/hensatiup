import { compileExpression } from "./expressions.js";
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

export function compileRule(source) {
  return compileExpression(source, ["g", "h", "steps"], { basic: true });
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
