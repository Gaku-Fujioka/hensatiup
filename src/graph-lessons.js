import { integer, integers, requireInput } from "./trace.js";

function breadthFirst({ n, edges, start }, observe = () => {}) {
  const next = Array.from({ length: n }, () => []);
  for (const [from, to] of edges) next[from].push(to);
  const queue = [start],
    seen = new Set(queue);
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    observe("キューの先頭を訪問", { node, queue: queue.slice(head), seen: [...seen] });
    for (const child of next[node]) {
      if (seen.has(child)) continue;
      seen.add(child);
      queue.push(child);
    }
  }
  return queue;
}

function depthFirst({ n, edges, start }, observe = () => {}) {
  const next = Array.from({ length: n }, () => []);
  for (const [from, to] of edges) next[from].push(to);
  const visited = new Set();
  function visit(node) {
    visited.add(node);
    observe("未訪問の頂点へ潜る", { node, visited: [...visited] });
    for (const child of next[node]) if (!visited.has(child)) visit(child);
    observe("呼び出し元に戻る", { node, visited: [...visited] });
  }
  visit(start);
  return [...visited];
}

function topologicalSort({ n, edges }, observe = () => {}) {
  const next = Array.from({ length: n }, () => []),
    degree = Array(n).fill(0);
  for (const [from, to] of edges) {
    next[from].push(to);
    degree[to]++;
  }
  const queue = [];
  for (let i = 0; i < n; i++) if (degree[i] === 0) queue.push(i);
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    observe("前提をすべて満たした頂点", { node, degree, queue: queue.slice(head) });
    for (const child of next[node]) {
      degree[child]--;
      if (!degree[child]) queue.push(child);
    }
  }
  return queue.length === n ? queue : null;
}

function dijkstra({ n, edges, start, goal }, observe = () => {}) {
  const next = Array.from({ length: n }, () => []);
  for (const [from, to, weight] of edges) next[from].push([to, weight]);
  const costs = Array(n).fill(Infinity),
    done = new Set();
  costs[start] = 0;
  while (done.size < n) {
    let node = -1;
    for (let i = 0; i < n; i++) {
      if (!done.has(i) && costs[i] < (node === -1 ? Infinity : costs[node])) node = i;
    }
    if (node === -1) break;
    done.add(node);
    observe("最小コストが確定", { node, costs, done: [...done] });
    if (node === goal) return costs[node];
    for (const [child, weight] of next[node]) {
      costs[child] = Math.min(costs[child], costs[node] + weight);
    }
  }
  return null;
}

function aStar({ grid, start, goal }, observe = () => {}) {
  const width = grid[0].length;
  function estimate(cell) {
    return (
      Math.abs((cell % width) - (goal % width)) +
      Math.abs(Math.floor(cell / width) - Math.floor(goal / width))
    );
  }
  const open = new Set([start]),
    cost = new Map([[start, 0]]);
  while (open.size) {
    let node,
      best = Infinity;
    for (const cell of open) {
      const score = cost.get(cell) + estimate(cell);
      if (score < best) {
        node = cell;
        best = score;
      }
    }
    open.delete(node);
    observe("距離の見積もりを含めて選択", { node, g: cost.get(node), h: estimate(node), open: [...open] });
    if (node === goal) return cost.get(node);
    const x = node % width,
      y = Math.floor(node / width);
    for (const [dx, dy] of [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ]) {
      if (grid[y + dy]?.[x + dx] !== ".") continue;
      const child = (y + dy) * width + x + dx;
      const candidate = cost.get(node) + 1;
      if (candidate >= (cost.get(child) ?? Infinity)) continue;
      cost.set(child, candidate);
      open.add(child);
    }
  }
  return null;
}

function inorder({ tree }, observe = () => {}) {
  const order = [];
  function visit(index) {
    if (tree[index] == null) return;
    visit(2 * index + 1);
    order.push(tree[index]);
    observe("左の部分木の後で根を読む", { tree, index, order }, [index]);
    visit(2 * index + 2);
  }
  visit(0);
  return order;
}

function connectedComponents({ n, edges }, observe = () => {}) {
  const parent = Array.from({ length: n }, (_, i) => i),
    size = Array(n).fill(1);
  function find(node) {
    while (node !== parent[node]) {
      parent[node] = parent[parent[node]];
      node = parent[node];
    }
    return node;
  }
  let groups = n;
  for (const [from, to] of edges) {
    let a = find(from),
      b = find(to);
    if (a === b) continue;
    if (size[a] < size[b]) [a, b] = [b, a];
    parent[b] = a;
    size[a] += size[b];
    groups--;
    observe("別々の集合を結ぶ", { from, to, parent, groups });
  }
  return groups;
}

function kruskal({ n, edges }, observe = () => {}) {
  const parent = Array.from({ length: n }, (_, i) => i);
  function find(v) {
    if (parent[v] !== v) parent[v] = find(parent[v]);
    return parent[v];
  }
  const chosen = [];
  let cost = 0;
  for (const [from, to, weight] of [...edges].sort((a, b) => a[2] - b[2])) {
    const a = find(from),
      b = find(to);
    if (a === b) {
      observe("閉路になる辺を除外", { from, to, weight, cost });
      continue;
    }
    parent[b] = a;
    chosen.push([from, to]);
    cost += weight;
    observe("安い辺を採用", { from, to, weight, chosen, cost });
  }
  return chosen.length === n - 1 ? cost : null;
}

function intervalScheduling({ intervals }, observe = () => {}) {
  const ordered = [...intervals].sort((a, b) => a[1] - b[1]);
  const selected = [];
  let end = -Infinity;
  for (const [start, finish] of ordered) {
    if (start < end) {
      observe("重なる予定をスキップ", { start, finish, end, selected });
      continue;
    }
    selected.push([start, finish]);
    end = finish;
    observe("終了時刻の早い予定を採用", { start, finish, selected });
  }
  return selected;
}

function balanced({ text }, observe = () => {}) {
  const pairs = { ")": "(", "]": "[", "}": "{" },
    stack = [];
  for (const char of text) {
    if ("([{".includes(char)) stack.push(char);
    else if (stack.pop() !== pairs[char]) return false;
    observe("括弧を読みスタックを更新", { char, stack });
  }
  return stack.length === 0;
}

function frequencies({ values }, observe = () => {}) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
    observe("キーの出現回数を更新", { value, counts: [...counts] });
  }
  return [...counts];
}

const graph = {
  n: 6,
  edges: [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],
    [3, 5],
    [4, 5],
  ],
  start: 0,
};
const weighted = {
  n: 5,
  edges: [
    [0, 1, 8],
    [0, 2, 2],
    [2, 1, 1],
    [1, 3, 2],
    [2, 3, 7],
    [3, 4, 1],
  ],
  start: 0,
  goal: 4,
};
const tree = { tree: [5, 3, 8, 1, 4, 7, 9] };
const graphIds = new Set(["bfs", "dfs", "topological", "dijkstra", "union", "kruskal"]);

function validate(id, input) {
  if (graphIds.has(id)) {
    integer(input.n, "n", 1, 10);
    const weighted = id === "dijkstra" || id === "kruskal";
    requireInput(Array.isArray(input.edges) && input.edges.length <= 24, "edges は24本までです。");
    for (const edge of input.edges) {
      requireInput(
        Array.isArray(edge) && edge.length === (weighted ? 3 : 2),
        "辺は " + (weighted ? "[始点,終点,重み]" : "[始点,終点]") + " で指定します。",
      );
      integer(edge[0], "始点", 0, input.n - 1);
      integer(edge[1], "終点", 0, input.n - 1);
      if (weighted) integer(edge[2], "重み", id === "kruskal" ? -99 : 0, 99);
    }
    if (["bfs", "dfs", "dijkstra"].includes(id)) integer(input.start, "start", 0, input.n - 1);
    if (id === "dijkstra") integer(input.goal, "goal", 0, input.n - 1);
  } else if (id === "astar") {
    const grid = input.grid;
    requireInput(
      Array.isArray(grid) &&
        grid.length >= 1 &&
        grid.length <= 8 &&
        grid.every((s) => typeof s === "string" && /^[.#]{1,8}$/.test(s) && s.length === grid[0].length),
      "grid は同じ幅の . と # の文字列で、最大8×8です。",
    );
    for (const key of ["start", "goal"]) {
      integer(input[key], key, 0, grid.length * grid[0].length - 1);
      requireInput(grid.join("")[input[key]] === ".", key + " は通行できるマスを指定してください。");
    }
  } else if (id === "inorder") {
    const t = input.tree;
    requireInput(
      Array.isArray(t) &&
        t.length <= 31 &&
        t.every(
          (v, i) =>
            v === null ||
            (Number.isInteger(v) && Math.abs(v) <= 99 && (!i || t[Math.floor((i - 1) / 2)] != null)),
        ),
      "tree は整数または null の配列（31個まで）。子には親が必要です。",
    );
  } else if (id === "interval") {
    requireInput(
      Array.isArray(input.intervals) &&
        input.intervals.length <= 16 &&
        input.intervals.every(
          (pair) =>
            Array.isArray(pair) &&
            pair.length === 2 &&
            pair.every((x) => Number.isInteger(x) && Math.abs(x) <= 99) &&
            pair[0] < pair[1],
        ),
      "intervals は [開始,終了] の配列です。開始 < 終了、各時刻は -99〜99、16件までです。",
    );
  } else if (id === "stack") {
    requireInput(
      typeof input.text === "string" && input.text.length <= 48 && /^[()[\]{}]*$/.test(input.text),
      "text には3種類の括弧 () [] {} を48文字まで入力できます。",
    );
  } else integers(input.values);
}

export const graphLessons = [
  [
    "bfs",
    "幅優先探索",
    "グラフと木",
    breadthFirst,
    graph,
    "先に見つけた頂点からキューで訪問し、出発点に近い層から順に広げます。",
    "乗り換え回数が少ない順に駅を調べる。",
    "O(V + E)",
    "有向辺の順に隣を登録します。キューに入れる時点で訪問印を付けると重複を防げます。",
  ],
  [
    "dfs",
    "深さ優先探索",
    "グラフと木",
    depthFirst,
    graph,
    "未訪問の隣へ進み、行き止まりで呼び出し元に戻ります。",
    "リンクをたどり、到達できるページを列挙する。",
    "O(V + E)",
    "最短経路を求める用途には向きません。閉路があっても訪問印で止まります。",
  ],
  [
    "topological",
    "トポロジカルソート",
    "グラフと木",
    topologicalSort,
    { n: 6, edges: graph.edges },
    "未処理の前提が0個の頂点を取り出し、その頂点に依存する仕事の前提数を減らします。",
    "前提科目に違反しない履修順を決める。",
    "O(V + E)",
    "辺は前提から依存先へ張ります。閉路があれば全件を並べられず null を返します。",
  ],
  [
    "dijkstra",
    "ダイクストラ法",
    "グラフと木",
    dijkstra,
    weighted,
    "累積コストが最も小さい未確定頂点を選び、その先の候補コストを更新します。",
    "運賃の異なる路線で最も安い料金を求める。",
    "O(V² + E)",
    "負の重みは扱えません。この実装は確定する頂点を線形探索します。到達不能なら null です。",
  ],
  [
    "astar",
    "A* 探索",
    "グラフと木",
    aStar,
    { grid: ["....", ".##.", "...."], start: 0, goal: 7 },
    "経過コスト g と残り距離の下限 h の合計が最小の候補から調べます。",
    "壁を避けて進むキャラクターの最短歩数を求める。",
    "この格子実装は O(V²)",
    "上下左右に各1で移動します。マス番号は左上を0として横に数え、# は壁です。",
  ],
  [
    "inorder",
    "二分木の中順走査",
    "グラフと木",
    inorder,
    tree,
    "左部分木、根、右部分木の順に再帰で読み取ります。",
    "二分探索木からキーを昇順に取り出す。",
    "O(n)",
    "昇順になるのは二分探索木の場合です。配列の null は子がない位置を表します。",
  ],
  [
    "stack",
    "スタックと括弧照合",
    "データ構造",
    balanced,
    { text: "{[()]}" },
    "開き括弧を積み、閉じ括弧が来たら最後に積んだ種類と照合します。",
    "式や設定ファイルの括弧の対応を確かめる。",
    "O(n)",
    "個数が同じでも ([)] は不正です。閉じる順番も検証します。",
  ],
  [
    "hash",
    "ハッシュ表による頻度集計",
    "データ構造",
    frequencies,
    { values: [4, 2, 4, 7, 2, 4] },
    "値をキーにして、取り出した回数を1ずつ更新します。",
    "商品ID別に注文数を集計する。",
    "平均 O(n)",
    "出力は初登場順の [値,回数] です。個数の多い順には並びません。",
  ],
  [
    "union",
    "Union-Find",
    "データ構造",
    connectedComponents,
    {
      n: 6,
      edges: [
        [0, 2],
        [1, 3],
        [2, 4],
        [0, 4],
      ],
    },
    "各頂点の代表をたどり、別々の集合なら小さい集合を大きい集合に結びます。",
    "回線を追加するたびに、独立したネットワークがいくつ残るか調べる。",
    "O(V + E α(V))",
    "辺は無向です。経路圧縮とサイズ併合を使います。α は非常にゆっくり増える関数です。",
  ],
  [
    "interval",
    "区間スケジューリング",
    "貪欲法",
    intervalScheduling,
    {
      intervals: [
        [0, 5],
        [1, 3],
        [3, 4],
        [4, 6],
        [5, 8],
      ],
    },
    "最も早く終わる予定から選べば、後ろに残る空き時間が最大になります。",
    "会議室1室に、重ならない予定を最多件数入れる。",
    "O(n log n)",
    "前の終了と次の開始は同時刻でも構いません。利益が予定ごとに違う問題は別の解法が必要です。",
  ],
  [
    "kruskal",
    "クラスカル法",
    "貪欲法",
    kruskal,
    { n: 5, edges: weighted.edges },
    "安い無向辺から、すでにつながった頂点間の辺を除いて採用します。",
    "全拠点をつなぐ配線の総費用を最小化する。",
    "辺の整列 O(E log E) ＋ 集合操作",
    "出発地と目的地の最短距離とは別の問題です。全体をつなげないと null を返します。",
  ],
].map(([id, title, group, solve, example, idea, use, time, note]) => ({
  id,
  title,
  group,
  solve,
  example,
  idea,
  use,
  time,
  note,
  validate: (input) => validate(id, input),
}));
