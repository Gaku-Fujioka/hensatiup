import { compileRule, grade, missions } from "./missions.js";

export const completed = new Set(readProgress());
function readProgress() {
  try {
    const value = JSON.parse(localStorage.getItem("routelab.completed.v1"));
    return Array.isArray(value)
      ? value.filter(
          (i) => Number.isInteger(i) && i >= 0 && i < missions.length,
        )
      : [];
  } catch {
    return [];
  }
}
const drafts = missions.map(() => "");
let stage = 0;
export function activeMission() {
  return missions[stage];
}
export function showWorkshop(sidebar, lower, onStage, onRun) {
  const m = activeMission();
  sidebar.innerHTML =
    '<section class="panel side"><h2>配送ミッション</h2><div class="mission-tabs"></div><h3></h3><p class="task"></p><form><label class="code-label" for="expr">priority =</label><input id="expr" class="expression" type="text" placeholder="式を入力" maxlength="100" autocomplete="off" spellcheck="false"><p class="hint">小さい値のマスから探索します。<br>演算子は +、*、括弧が使えます。</p><button class="primary" type="submit">配送を実行</button></form><div class="result" role="status"></div><details><summary>ヒントを読む</summary><p class="hint"></p><details><summary>解答例を見る</summary><code></code></details></details></section>' +
    '<section class="panel side lesson"><span class="tag">式に使える変数</span><p><b>steps</b>　出発地からの歩数<br><b>g</b>　ここまでの累積コスト<br><b>h</b>　目的地までの縦横の距離</p></section>';
  const tabs = sidebar.querySelector(".mission-tabs");
  missions.forEach((mission, i) => {
    const button = document.createElement("button");
    button.textContent = i + 1 + (completed.has(i) ? " ✓" : "");
    button.setAttribute(
      "aria-label",
      mission.name + (completed.has(i) ? " 達成済み" : ""),
    );
    button.setAttribute("aria-pressed", String(i === stage));
    button.onclick = () => {
      stage = i;
      onStage();
      document.querySelector(".mission-tabs [aria-pressed=true]")?.focus();
    };
    tabs.append(button);
  });
  sidebar.querySelector("h3").textContent = m.name;
  sidebar.querySelector(".task").textContent = m.task;
  sidebar.querySelector("details p").textContent = m.hint;
  sidebar.querySelector("details code").textContent = m.example;
  const input = sidebar.querySelector("input");
  input.value = drafts[stage];
  input.oninput = () => {
    drafts[stage] = input.value;
  };
  const message = sidebar.querySelector(".result");
  lower.innerHTML =
    '<div class="below"><section class="panel lower-panel"><h2>配送結果</h2><div id="scores"><p>式を実行すると、3つの地図での結果が表示されます。</p></div></section><section class="panel lower-panel"><h2>経路の確認</h2><p id="runName">地図には見本として幅優先探索を表示しています。式を実行すると、自分の探索手順を再生できます。</p><a href="#lab" class="text-link">探索ラボで復習する</a></section></div>';
  sidebar.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    let rule;
    try {
      rule = compileRule(input.value);
    } catch (error) {
      message.textContent = error.message;
      input.focus();
      return;
    }
    const rows = grade(m, rule);
    const passed = rows.filter((r) => r.pass).length;
    message.textContent =
      passed === rows.length
        ? "達成！ 3つの地図で配送条件を満たしました。"
        : passed + " / 3 件クリア。目標との差を見て、式を調整してみましょう。";
    if (passed === rows.length) {
      completed.add(stage);
      try {
        localStorage.setItem(
          "routelab.completed.v1",
          JSON.stringify([...completed]),
        );
      } catch {
        message.textContent += " この環境では進捗を保存できません。";
      }
      tabs.children[stage].textContent = stage + 1 + " ✓";
      tabs.children[stage].setAttribute("aria-label", m.name + " 達成済み");
    }
    const metric = m.target === "bfs" ? "steps" : "cost";
    document.getElementById("scores").innerHTML =
      "<table><thead><tr><th>地図</th><th>" +
      (metric === "steps" ? "歩数" : "コスト") +
      " / 目標</th><th>探索" +
      (m.target === "astar" ? " / 上限" : "マス") +
      "</th><th>判定</th></tr></thead><tbody>" +
      rows
        .map(
          (r) =>
            "<tr><td>" +
            r.map.name +
            "</td><td>" +
            r.actual[metric] +
            " / " +
            r.expected[metric] +
            "</td><td>" +
            r.actual.visited +
            (m.target === "astar" ? " / " + r.expected.visited : "") +
            "</td><td>" +
            (r.pass ? "達成" : "再挑戦") +
            "</td></tr>",
        )
        .join("") +
      "</tbody></table>";
    document.getElementById("runName").textContent =
      "現在の探索式は " +
      input.value +
      "。先頭に戻ると、自分の探索を1手ずつ確認できます。";
    onRun(rows.find((r) => r.map.id === m.map).actual);
  };
}
