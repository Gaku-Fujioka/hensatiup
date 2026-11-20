import { maps } from "./maps.js";
import { explore, rules } from "./search.js";
import { lessons } from "./lessons.js";
import { draw, coordinates, boardLabel } from "./atlas.js";
import { openLibrary, stopLibrary } from "./library.js";
import { editor, paint, quiz } from "./editor.js";
import { activeMission, completed, showWorkshop } from "./workshop.js";

const $ = (id) => document.getElementById(id);
const canvas = $("map");
const preset = $("preset");
maps.forEach((map) => preset.add(new Option(map.name, map.id)));
for (let x = 0; x < maps[0].cols; x++)
  $("colLabels").append(
    Object.assign(document.createElement("span"), {
      textContent: String.fromCharCode(65 + x),
    }),
  );
for (let y = 1; y <= maps[0].rows; y++)
  $("rowLabels").append(
    Object.assign(document.createElement("span"), { textContent: y }),
  );

let map = structuredClone(maps[0]);
let algorithm = "bfs";
let results,
  result,
  step = 0,
  timer = null,
  cursor = null;
let mode = "lab";
let editing = false;
let labMap = map;
const editedMaps = new Map([[map.id, map]]);
const choices = Object.entries(lessons);
function analyse() {
  results = Object.fromEntries(
    Object.entries(rules).map(([key, rule]) => [key, explore(map, rule)]),
  );
  result = results[algorithm];
  step = 0;
}

function renderBoard() {
  const last = result.frames.length - 1;
  const frame = result.frames[step];
  draw(canvas, map, result, step, cursor);
  $("status").textContent = timer
    ? "再生中"
    : step === last
      ? result.path.length
        ? "到着"
        : "到達不能"
      : step
        ? "一時停止"
        : "待機中";
  $("status").dataset.on = String(Boolean(timer));
  $("play").textContent = timer
    ? "Ⅱ　停止"
    : step === last
      ? "↺　もう一度"
      : "▶　再生";
  $("prev").disabled = $("rewind").disabled = step === 0;
  $("next").disabled = step === last;
  $("seek").max = last;
  $("seek").value = step;
  $("step").textContent = step + " / " + last;
  $("narration").textContent =
    step === 0
      ? "出発地 S から探索を始めます。再生するか、1ステップずつ進めてください。"
      : step === last
        ? result.path.length
          ? "目的地 G に到着。経路は" +
            result.steps +
            "歩、合計コストは" +
            result.cost +
            "です。"
          : "すべての候補を調べました。目的地へ通れる経路はありません。"
        : coordinates(map, frame.current) +
          " を探索。ここまでのコストは" +
          frame.cost +
          "、次に調べる候補は" +
          frame.frontier.length +
          "マスです。";
  $("cellInfo").textContent = cursor === null ? "" : boardLabel(map, cursor);
}
function pause() {
  clearInterval(timer);
  timer = null;
}
function go(to) {
  pause();
  step = Math.min(result.frames.length - 1, Math.max(0, to));
  renderBoard();
}
function play() {
  if (timer) {
    pause();
    renderBoard();
    return;
  }
  if (step === result.frames.length - 1) step = 0;
  timer = setInterval(
    () => {
      step++;
      if (step >= result.frames.length - 1) pause();
      renderBoard();
    },
    Number($("speed").value),
  );
  renderBoard();
}
$("play").onclick = play;
$("next").onclick = () => go(step + 1);
$("prev").onclick = () => go(step - 1);
$("rewind").onclick = () => go(0);
$("seek").oninput = (e) => go(Number(e.target.value));
$("speed").onchange = () => {
  if (timer) {
    pause();
    play();
  }
};

function comparison() {
  const rows = choices
    .map(([key, lesson]) => {
      const r = results[key];
      return (
        "<tr><td>" +
        lesson.title +
        "</td><td>" +
        (r.steps ?? "—") +
        "</td><td>" +
        (r.cost ?? "—") +
        "</td><td>" +
        r.visited +
        "</td></tr>"
      );
    })
    .join("");
  return (
    '<section class="panel lower-panel"><h2>同じ地図で比較</h2><table><thead><tr><th>探索方法</th><th>歩数</th><th>コスト</th><th>探索マス</th></tr></thead><tbody>' +
    rows +
    '</tbody></table><p class="hint">探索マスは、候補から取り出して調べたマスの数です。</p></section>'
  );
}
function lab() {
  $("sidebar").innerHTML =
    '<section class="panel side"><h2>アルゴリズム</h2><div class="choices">' +
    choices
      .map(
        ([key, l]) =>
          '<button class="algorithm ' +
          (key === algorithm ? "selected" : "") +
          '" data-rule="' +
          key +
          '" aria-pressed="' +
          (key === algorithm) +
          '"><span class="symbol"><svg viewBox="0 0 24 24" aria-hidden="true">' +
          l.icon +
          "</svg></span><span><strong>" +
          l.title +
          '</strong><small lang="en">' +
          l.en +
          '</small></span><i class="radio" aria-hidden="true"></i></button>',
      )
      .join("") +
    "</div></section>" +
    '<section class="panel side lesson"><span class="tag">探索のしくみ</span><h2>' +
    lessons[algorithm].heading +
    "</h2><p>" +
    lessons[algorithm].detail +
    '</p><p><a class="text-link" href="#learn/'+algorithm+'">JavaScript実装と変数を見る</a></p><a class="text-link" href="#mission">配送ミッションで使う</a></section>';
  for (const button of document.querySelectorAll("[data-rule]"))
    button.onclick = () => {
      pause();
      algorithm = button.dataset.rule;
      result = results[algorithm];
      step = 0;
      render();
      document.querySelector('[data-rule="' + algorithm + '"]').focus();
    };
  $("lower").innerHTML =
    '<div class="below">' +
    comparison() +
    '<section class="panel lower-panel" id="editor"><h2>地形と移動ルール</h2><p>上下左右に1マスずつ進めます。平地はコスト1、砂地は4。森と水辺は通れません。</p></section></div>';
}
function render() {
  $("progress").textContent = completed.size + " / 3";
  if (mode === "lab") {
    lab();
    quiz($("sidebar"), algorithm);
    editor(
      $("editor"),
      editing,
      () => {
        pause();
        editing = !editing;
        render();
        document.getElementById("edit").focus();
      },
      () => {
        pause();
        map = structuredClone(maps.find((m) => m.id === map.id));
        editedMaps.set(map.id, map);
        analyse();
        render();
      },
    );
  } else {
    showWorkshop($("sidebar"), $("lower"), openPage, (actual) => {
      pause();
      result = actual;
      step = result.frames.length - 1;
      renderBoard();
      $("progress").textContent = completed.size + " / 3";
    });
  }
  canvas.classList.toggle("editing", editing && mode === "lab");
  renderBoard();
}
preset.onchange = () => {
  pause();
  map =
    editedMaps.get(preset.value) ??
    structuredClone(maps.find((m) => m.id === preset.value));
  editedMaps.set(map.id, map);
  cursor = null;
  analyse();
  render();
};
function applyBrush(cell) {
  if (!editing || mode !== "lab") return;
  if (paint(map, cell)) {
    pause();
    analyse();
    render();
  }
}
canvas.onclick = (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(
    0,
    Math.min(
      map.cols - 1,
      Math.floor(((e.clientX - rect.left) * map.cols) / rect.width),
    ),
  );
  const y = Math.max(
    0,
    Math.min(
      map.rows - 1,
      Math.floor(((e.clientY - rect.top) * map.rows) / rect.height),
    ),
  );
  cursor = y * map.cols + x;
  applyBrush(cursor);
  renderBoard();
};
canvas.onfocus = () => {
  cursor ??= map.start;
  renderBoard();
};
canvas.onblur = () => {
  cursor = null;
  renderBoard();
};
canvas.onkeydown = (e) => {
  const pos = cursor ?? map.start,
    col = pos % map.cols;
  const moves = {
    ArrowRight: col < map.cols - 1 ? pos + 1 : pos,
    ArrowLeft: col > 0 ? pos - 1 : pos,
    ArrowDown: Math.min(pos + map.cols, (map.rows - 1) * map.cols + col),
    ArrowUp: Math.max(col, pos - map.cols),
  };
  if (e.key in moves) {
    e.preventDefault();
    cursor = moves[e.key];
    renderBoard();
  }
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    applyBrush(pos);
  }
};
function openPage() {
  pause();
  cursor = null;
  if (mode === "lab") labMap = map;
  stopLibrary();
  const learning = ["", "#library", "#compare"].includes(location.hash) || location.hash.startsWith("#learn/");
  $("library").hidden = !learning;
  $("routeLab").hidden = learning;
  if (learning) {
    mode = "library";
    $("navLab").removeAttribute("aria-current");
    $("navMission").removeAttribute("aria-current");
    $("navLibrary").setAttribute("aria-current", "page");
    openLibrary(location.hash);
    window.scrollTo(0, 0);
    return;
  }
  $("navLibrary").removeAttribute("aria-current");
  mode = location.hash === "#mission" ? "mission" : "lab";
  const mission = mode === "mission";
  map = mission ? maps.find((m) => m.id === activeMission().map) : labMap;
  preset.value = map.id;
  preset.disabled = mission;
  $("pageTitle").textContent = mission ? "配送ミッション" : "経路探索ラボ";
  document.title = $("pageTitle").textContent + " · RouteLab";
  $("subtitle").textContent = mission
    ? "優先順位の式を書いて、自分のアルゴリズムで荷物を届けよう。"
    : "同じ地図を、違う考え方で。探索の一手を見てみよう。";
  for (const [id, active] of [
    ["navLab", !mission],
    ["navMission", mission],
  ]) {
    if (active) $(id).setAttribute("aria-current", "page");
    else $(id).removeAttribute("aria-current");
  }
  analyse();
  if (mission) result = results.bfs;
  render();
}
window.addEventListener("hashchange", openPage);
openPage();
