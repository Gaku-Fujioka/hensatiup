const tools = [
  [".", "平地"],
  [":", "砂地"],
  ["#", "森"],
  ["~", "水辺"],
  ["start", "出発地"],
  ["goal", "目的地"],
];
let brush = ":";
export function paint(map, cell) {
  if (brush === "start" || brush === "goal") {
    if (cell === map.start || cell === map.goal) return false;
    map.cells[cell] = ".";
    map[brush] = cell;
    return true;
  }
  if (cell === map.start || cell === map.goal || map.cells[cell] === brush)
    return false;
  map.cells[cell] = brush;
  return true;
}
export function editor(container, editing, toggle, reset) {
  container.innerHTML =
    '<div class="title-line"><h2>地図エディタ</h2><button id="edit" aria-pressed="' +
    editing +
    '">' +
    (editing ? "編集を終了" : "地図を編集") +
    "</button></div><p>平地はコスト1、砂地は4。森と水辺は通れません。地形を変えて、配送ルートを比べてみましょう。</p>";
  container.querySelector("#edit").onclick = toggle;
  if (!editing) return;
  const palette = document.createElement("div");
  palette.className = "tools";
  container.append(palette);
  tools.forEach(([key, label]) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.setAttribute("aria-pressed", String(key === brush));
    button.onclick = () => {
      brush = key;
      for (const b of palette.children)
        b.setAttribute("aria-pressed", String(b === button));
    };
    palette.append(button);
  });
  const hint = document.createElement("p");
  hint.className = "hint";
  hint.textContent =
    "種類を選んで地図のマスをクリック。キーボードでは地図にフォーカスし、矢印で移動、Enterで配置します。";
  container.append(hint);
  const undo = document.createElement("button");
  undo.textContent = "元の地形に戻す";
  undo.onclick = reset;
  container.append(undo);
}

const questions = {
  bfs: [
    "幅優先探索で最初に到着するのは？",
    ["歩数が最少の経路", "コストが最小の経路"],
    0,
    "幅優先探索は同じ歩数のマスを順番に調べるため、到着までの歩数が最少になります。",
  ],
  dijkstra: [
    "目的地の手前に砂地が続いていたら？",
    ["必ず直進する", "安ければ遠回りする"],
    1,
    "ダイクストラ法は累積コストを比べるので、平地を遠回りした経路が選ばれることもあります。",
  ],
  astar: [
    "A* が優先順位に足す見積もりは？",
    ["出発地からの歩数", "目的地までの縦横の距離"],
    1,
    "この地図では縦横の距離が、残りのコストの下限になります。",
  ],
};
export function quiz(sidebar, algorithm) {
  const [q, answers, correct, why] = questions[algorithm];
  const card = document.createElement("section");
  card.className = "panel side";
  card.innerHTML =
    '<h2>予想してみよう</h2><p></p><div class="answers"></div><div class="feedback" role="status"></div>';
  card.querySelector("p").textContent = q;
  answers.forEach((text, i) => {
    const b = document.createElement("button");
    b.textContent = text;
    b.onclick = () => {
      card.querySelector(".feedback").textContent =
        (i === correct ? "正解。" : "もう一度考えてみよう。") + why;
    };
    card.querySelector(".answers").append(b);
  });
  sidebar.append(card);
}
