import { graphView } from "./graph-view.js";
import { planCargo, planNetwork, planReservations } from "./applied-plans.js";
import { useCases } from "./use-cases.js";

const pages = new Map();
const supplies = ["飲料水", "毛布", "救急箱", "ランタン", "浄水器"];
const stations = ["本部", "診療所", "峠", "集落"];

function element(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}
function numberField(value, min, max, label) {
  const input = document.createElement("input");
  input.type = "number";
  input.min = min;
  input.max = max;
  input.required = true;
  input.value = value;
  input.setAttribute("aria-label", label);
  return input;
}

function cargo(panel, report) {
  const { weights, profits, capacity } = useCases.knapsack.input;
  panel.innerHTML = `<label class="capacity-label">積載量 <output></output><input type="range" aria-label="積載量" min="0" max="24"></label>
    <fieldset><legend>あなたが積む物資</legend><div class="supply-list"></div></fieldset>`;
  const slider = panel.querySelector("input");
  slider.value = capacity;
  const picks = supplies.map((name, i) => {
    const row = document.createElement("label");
    const check = document.createElement("input");
    check.type = "checkbox";
    row.append(check, element("strong", name), element("small", weights[i] + " kg · " + profits[i] + " pt"));
    panel.querySelector(".supply-list").append(row);
    return check;
  });
  return () => {
    const limit = Number(slider.value);
    panel.querySelector("output").textContent = limit + " kg";
    const input = { weights, profits, capacity: limit };
    const best = planCargo(input);
    const weight = picks.reduce((sum, check, i) => sum + (check.checked ? weights[i] : 0), 0);
    const score = picks.reduce((sum, check, i) => sum + (check.checked ? profits[i] : 0), 0);
    const meter = document.createElement("meter");
    meter.min = 0;
    meter.max = Math.max(1, limit);
    meter.value = Math.min(weight, limit);
    meter.setAttribute("aria-label", "積載量の使用状況");
    let verdict = "あと" + (best.score - score) + "ポイント増やせます。";
    if (weight > limit) verdict = (weight - limit) + " kg超過。荷物を降ろすと出発できます。";
    else if (score === best.score) verdict = "この積み方で最高得点です。";
    report.append(element("h2", "あなたの積み荷　" + weight + " / " + limit + " kg"), meter,
      element("p", score + "ポイント。 " + verdict),
      element("h3", "最適な積み方の一例"),
      element("p", (best.picked.map((i) => supplies[i]).join("・") || "積み荷なし") + "（" + best.weight + " kg、" + best.score + "ポイント）"));
    return input;
  };
}

function reservations(panel, report) {
  const requests = [];
  let serial = 0;
  panel.innerHTML = `<fieldset><legend>希望する時間帯</legend><p>開始・終了は0〜24時の整数で入力します。</p><div class="request-list"></div></fieldset>
    <button type="button" class="add-request">予約を追加</button>`;
  const list = panel.querySelector(".request-list");
  const add = panel.querySelector(".add-request");
  function addRow(start, end) {
    const name = "予約" + (++serial);
    const row = element("div", "");
    row.className = "request-row";
    const from = numberField(start, 0, 23, name + " 開始時刻");
    const to = numberField(end, 1, 24, name + " 終了時刻");
    const remove = element("button", "削除");
    remove.type = "button";
    remove.setAttribute("aria-label", name + "を削除");
    const request = { name, from, to };
    remove.onclick = () => {
      requests.splice(requests.indexOf(request), 1);
      row.remove();
      add.disabled = false;
      add.focus();
      panel.dispatchEvent(new Event("input"));
    };
    requests.push(request);
    row.append(element("strong", name), from, element("span", "〜"), to, remove);
    list.append(row);
    add.disabled = requests.length >= 16;
    return from;
  }
  useCases.interval.input.intervals.forEach(([a, b]) => addRow(a, b));
  add.onclick = () => {
    addRow(13, 14).focus();
    panel.dispatchEvent(new Event("input"));
  };
  return () => {
    const intervals = requests.map(({ name, from, to }) => {
      if (!from.validity.valid || !to.validity.valid || from.valueAsNumber >= to.valueAsNumber)
        throw new Error(name + "の開始・終了を確認してください。終了は開始より後の時刻にします。");
      return [from.valueAsNumber, to.valueAsNumber];
    });
    const chosen = planReservations({ intervals });
    report.append(element("h2", "受け付けられる予約　" + chosen.length + " / " + requests.length + "件"));
    if (chosen.length) {
      const dayStart = intervals[chosen[0]][0];
      const dayEnd = intervals[chosen.at(-1)][1];
      const track = element("div", "");
      track.className = "booking-track";
      track.setAttribute("aria-hidden", "true");
      for (const i of chosen) {
        const [start, end] = intervals[i];
        const block = element("span", "");
        block.style.left = (100 * (start - dayStart) / (dayEnd - dayStart)) + "%";
        block.style.width = (100 * (end - start) / (dayEnd - dayStart)) + "%";
        block.title = requests[i].name + "　" + start + "〜" + end + "時";
        track.append(block);
      }
      const axis = element("div", "");
      axis.className = "booking-axis";
      axis.append(element("small", dayStart + "時"), element("small", dayEnd + "時"));
      report.append(track, axis);
    }
    const schedule = document.createElement("ol");
    schedule.className = "booking-order";
    for (const i of chosen) schedule.append(element("li", requests[i].name + "　" + intervals[i].join("時 〜 ") + "時"));
    const skipped = requests.filter((_, i) => !chosen.includes(i)).map((r) => r.name);
    report.append(schedule, element("p", skipped.length ? "時間が重なる予約　" + skipped.join("・") : requests.length ? "すべての予約が収まります。" : "予約を追加すると利用順が表示されます。"));
    return { intervals };
  };
}

function network(panel, report) {
  const { n, edges } = useCases.kruskal.input;
  panel.innerHTML = `<fieldset><legend>使える区間と敷設費</legend><p>通れない区間のチェックを外したり、工事費を変えたりできます。</p><div class="cable-list"></div></fieldset>`;
  const controls = edges.map(([a, b, cost]) => {
    const route = stations[a] + " ↔ " + stations[b];
    const row = element("div", "");
    const label = element("label", "");
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = true;
    label.append(check, document.createTextNode(route));
    const price = numberField(cost, 0, 99, route + "の敷設費");
    check.oninput = () => { price.disabled = !check.checked; };
    row.append(label, price, element("small", "万円"));
    panel.querySelector(".cable-list").append(row);
    return { a, b, check, price };
  });
  return () => {
    const active = [];
    for (const { a, b, check, price } of controls) {
      if (!check.checked) continue;
      if (!price.validity.valid) throw new Error("敷設費は0〜99万円の整数で入力してください。");
      active.push([a, b, price.valueAsNumber]);
    }
    const input = { n, edges: active };
    const { cost, chosen } = planNetwork(input);
    report.append(element("h2", cost === null ? "すべての拠点をつなげません" : "最小の敷設費　" + cost + "万円"));
    const diagram = graphView("kruskal", input, {}, { names: stations, highlighted: chosen });
    diagram.setAttribute("aria-label", "使える回線と区間ごとの敷設費。太線は採用した回線。");
    report.append(diagram, element("small", "教材の頂点番号　" + stations.map((name, i) => i + " " + name).join("　")));
    report.append(element("p", cost === null ? "使える区間を増やし、孤立した拠点をつないでください。" :
      "敷設する区間　" + chosen.map(([a, b]) => stations[a] + "―" + stations[b]).join("、")));
    return input;
  };
}

const workbenches = { knapsack: cargo, interval: reservations, kruskal: network };
export const applicationIds = Object.keys(workbenches);

export function openApplication(root, lesson, openTrace) {
  const id = lesson.id;
  const scenario = useCases[id];
  document.title = scenario.title + " · RouteLab";
  if (!pages.has(id)) {
    const page = document.createElement("div");
    page.className = "applied-page";
    page.innerHTML = `<a class="back-link" href="#library">図鑑の一覧へ</a>
      <div class="lib-heading"><div><a class="text-link applied-lesson"></a><h1></h1><p></p></div></div>
      <div class="applied-grid"><section class="study-panel applied-controls"></section>
      <section class="study-panel applied-result"><div aria-live="polite"></div><button class="primary" type="button">この条件でコードと手順を見る</button></section></div>`;
    const lessonLink = page.querySelector(".applied-lesson");
    lessonLink.href = "#learn/" + id;
    lessonLink.textContent = lesson.title;
    page.querySelector("h1").textContent = scenario.title;
    page.querySelector(".lib-heading p").textContent = scenario.description;
    const panel = page.querySelector(".applied-controls");
    const report = page.querySelector("[aria-live]");
    const inspect = page.querySelector(".applied-result button");
    const readPlan = workbenches[id](panel, report);
    let current;
    function update() {
      report.replaceChildren();
      try {
        current = readPlan();
        inspect.disabled = false;
      } catch (error) {
        report.replaceChildren(element("p", error.message));
        inspect.disabled = true;
      }
    }
    panel.oninput = update;
    inspect.onclick = () => {
      openTrace(id, current);
      location.hash = "#learn/" + id;
    };
    update();
    pages.set(id, page);
  }
  root.replaceChildren(pages.get(id));
}
