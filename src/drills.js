import { compileExpression } from "./expressions.js";

function binaryIndex({ values, target }, blank) {
  let left = 0,
    right = values.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (values[mid] === target) return mid;
    if (values[mid] < target) {
      const next = blank({ left, mid, right });
      if (!Number.isInteger(next) || next <= left || next > right + 1)
        throw new Error("探索範囲が正しく縮まりません。");
      left = next;
    } else right = mid - 1;
  }
  return -1;
}
function maxWindow({ values, width }, blank) {
  let sum = values.slice(0, width).reduce((a, b) => a + b, 0);
  let best = sum;
  for (let i = width; i < values.length; i++) {
    const outgoing = values[i - width],
      incoming = values[i];
    sum = blank({ sum, outgoing, incoming });
    best = Math.max(best, sum);
  }
  return best;
}
function commonDivisor({ a, b }, blank) {
  while (b !== 0) {
    const remainder = blank({ a, b });
    if (!Number.isInteger(remainder) || remainder < 0 || remainder >= b)
      throw new Error("余りは0以上、割る数未満の整数です。");
    [a, b] = [b, remainder];
  }
  return a;
}
function meetingCount({ intervals }, blank) {
  let end = -Infinity,
    count = 0;
  for (const [start, finish] of [...intervals].sort((a, b) => a[1] - b[1])) {
    if (blank({ start, end })) {
      end = finish;
      count++;
    }
  }
  return count;
}
function fib({ n }, blank) {
  if (n === 0) return 0;
  let prev = 0,
    current = 1;
  for (let i = 2; i <= n; i++) {
    const next = blank({ prev, current });
    [prev, current] = [current, next];
  }
  return current;
}
function change({ coins, amount }, blank) {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let total = 1; total <= amount; total++) {
    for (const coin of coins) {
      if (coin > total) continue;
      const best = dp[total],
        previous = dp[total - coin];
      dp[total] = blank({ best, previous });
    }
  }
  return Number.isFinite(dp[amount]) ? dp[amount] : null;
}

export const drills = [
  {
    id: "binary",
    title: "二分探索の左端",
    task: "中央の値が小さすぎたとき、次の左端を返してください。",
    names: ["left", "mid", "right"],
    hint: "中央はすでに候補から外せます。",
    answer: "mid + 1",
    solve: binaryIndex,
    cases: [
      [{ values: [1, 3, 6, 9, 11], target: 9 }, 3],
      [{ values: [0, 1, 2, 3, 4, 5], target: 5 }, 5],
      [{ values: [2], target: 3 }, -1],
      [{ values: [1, 4, 7, 9, 10, 15, 20, 31, 40], target: 20 }, 6],
    ],
  },
  {
    id: "window",
    title: "売上の移動合計",
    task: "前の区間合計 sum、区間から出る outgoing、入る incoming から次の合計を作ってください。",
    names: ["sum", "outgoing", "incoming"],
    hint: "新しい窓には、前の先頭が含まれません。",
    answer: "sum - outgoing + incoming",
    solve: maxWindow,
    cases: [
      [{ values: [2, 5, 1, 4], width: 2 }, 7],
      [{ values: [1, 2, 8, 4], width: 2 }, 12],
      [{ values: [-5, -1, -2], width: 2 }, -3],
      [{ values: [2, 9, 4], width: 1 }, 9],
    ],
  },
  {
    id: "gcd",
    title: "互除法の余り",
    task: "幅と高さを約分するため、次に残す余りを求めてください。",
    names: ["a", "b"],
    hint: "割り算の余りを返す演算子は % です。",
    answer: "a % b",
    solve: commonDivisor,
    cases: [
      [{ a: 84, b: 30 }, 6],
      [{ a: 9, b: 27 }, 9],
      [{ a: 35, b: 12 }, 1],
      [{ a: 102, b: 68 }, 34],
    ],
  },
  {
    id: "interval",
    title: "会議室の予約条件",
    task: "直前の予定の終了時刻 end と、次の開始時刻 start で、予約を追加できる条件を書いてください。",
    names: ["start", "end"],
    hint: "終了した瞬間から次の人が使えます。",
    answer: "start >= end",
    solve: meetingCount,
    cases: [
      [
        {
          intervals: [
            [1, 3],
            [3, 5],
            [4, 6],
          ],
        },
        2,
      ],
      [
        {
          intervals: [
            [0, 8],
            [1, 3],
            [4, 6],
            [7, 9],
          ],
        },
        3,
      ],
      [
        {
          intervals: [
            [-5, -3],
            [-3, 0],
            [0, 1],
          ],
        },
        3,
      ],
      [
        {
          intervals: [
            [1, 3],
            [1, 3],
          ],
        },
        1,
      ],
    ],
  },
  {
    id: "fibonacci",
    title: "直前の2項で更新",
    task: "ひとつ前の項 current と、その前の項 prev から次のフィボナッチ数を返してください。",
    names: ["prev", "current"],
    hint: "F(2)=1、F(3)=2、F(4)=3 と続きます。",
    answer: "prev + current",
    solve: fib,
    cases: [
      [{ n: 2 }, 1],
      [{ n: 4 }, 3],
      [{ n: 7 }, 13],
      [{ n: 10 }, 55],
    ],
  },
  {
    id: "change",
    title: "お釣りの最少枚数",
    task: "これまでの候補 best と、この硬貨を使う前の残額に必要な枚数 previous を使って最少枚数を更新してください。",
    names: ["best", "previous"],
    hint: "硬貨を1枚追加した場合と、現在の最良値の小さい方です。",
    answer: "Math.min(best, previous + 1)",
    solve: change,
    cases: [
      [{ coins: [1, 3, 4], amount: 6 }, 2],
      [{ coins: [2, 5], amount: 7 }, 2],
      [{ coins: [2], amount: 3 }, null],
      [{ coins: [1, 5, 11], amount: 15 }, 3],
    ],
  },
];

export function checkDrill(drill, source) {
  const expression = compileExpression(source, drill.names);
  return drill.cases.map(([input, expected]) => {
    try {
      const actual = drill.solve(input, expression);
      return { input, expected, actual, passed: actual === expected };
    } catch (error) {
      return { input, expected, error: error.message, passed: false };
    }
  });
}
