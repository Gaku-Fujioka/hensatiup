import {
  assignments,
  extendRoute,
  fileDelivery,
  fileMedal,
  isOfficial,
  itinerary,
  lastStop,
  loadRecords,
  loadMedals,
  mapKey,
  positionAt,
  recordKey,
} from "./expedition.js";
import { lessons } from "./lessons.js";
import { markersReached, missionMarkers, missionObjectives, ranks } from "./quest.js";
import { updateMissionBoard } from "./mission-board.js";

const pace = 120; // Real milliseconds per unit of simulated fuel.
const $ = (id) => document.getElementById(id);

export class RescueControl {
  constructor(redraw, day, nextQuest) {
    this.redraw = redraw;
    this.day = day;
    this.nextQuest = nextQuest;
    try {
      this.storage = window.localStorage;
    } catch {
      /* The log can be session-only. */
    }
    this.records = loadRecords(this.storage);
    this.medals = loadMedals(this.storage);
    this.phase = "plan";
    this.route = [];
    this.elapsed = 0;
    this.notice = "";
  }
  configure(map, rule, result, optimal) {
    const key = mapKey(map);
    if (key !== this.key) {
      this.resetClock();
      this.key = key;
      this.route = [map.start];
      this.notice = "";
      this.official = isOfficial(map);
      this.accepted = !this.official;
      this.markers = this.official ? missionMarkers(map, optimal.path) : [];
    } else if (rule !== this.rule) {
      this.resetClock();
      this.notice = "";
    }
    this.map = map;
    this.rule = rule;
    this.result = result;
    this.budget = this.official ? assignments[map.id].budget : optimal.cost;
    this.plan = itinerary(map, this.route);
  }
  resetClock() {
    cancelAnimationFrame(this.animation);
    this.phase = "plan";
    this.elapsed = 0;
    this.race = null;
  }
  leave() {
    this.resetClock();
    this.notice = "";
  }
  point(cell) {
    if (this.phase !== "plan") return;
    if (!this.accepted) {
      $("routeNotice").textContent = "「任務を受ける」で応答して、ルートを描き始めましょう。";
      return;
    }
    const update = extendRoute(this.map, this.route, cell);
    this.route = update.route;
    this.notice = update.notice;
    this.plan = itinerary(this.map, this.route);
    this.refresh();
  }
  undo() {
    if (this.route.length > 1) this.point(this.route.at(-2));
  }
  restart() {
    this.resetClock();
    this.notice = "";
    this.refresh();
  }
  launch() {
    if (!this.accepted) {
      this.accepted = true;
      this.refresh();
      $("map").focus({ preventScroll: true });
      return;
    }
    if (this.phase === "finished") {
      this.restart();
      return;
    }
    if (this.phase === "running") {
      cancelAnimationFrame(this.animation);
      this.phase = "paused";
      this.refresh();
      return;
    }
    if (this.phase === "plan") {
      if (this.route.at(-1) !== this.map.goal || !this.result.path.length) return;
      this.race = { player: this.plan, guide: itinerary(this.map, this.result.path) };
      this.elapsed = 0;
    }
    this.phase = "running";
    this.notice = "";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.finish();
      return;
    }
    const start = performance.now() - this.elapsed * pace;
    const frame = (time) => {
      this.elapsed = Math.max(0, Math.min(this.duration(), (time - start) / pace));
      if (this.elapsed >= this.duration()) {
        this.finish();
        return;
      }
      this.redraw();
      this.updateCounters();
      this.animation = requestAnimationFrame(frame);
    };
    this.refresh();
    this.animation = requestAnimationFrame(frame);
  }
  duration() {
    return this.race ? Math.max(this.race.player.fuel, this.race.guide.fuel) : 0;
  }
  finish() {
    if (!this.race || this.phase === "finished") return;
    cancelAnimationFrame(this.animation);
    this.elapsed = this.duration();
    this.phase = "finished";
    this.records = fileDelivery(this.records, this.map, this.plan.fuel, this.storage);
    if (this.official) {
      const stars = missionObjectives(this.map, this.plan, this.markers).filter((goal) => goal.met).length;
      this.medals = fileMedal(this.medals, this.map, stars, this.storage);
      this.updateLog();
    }
    this.refresh();
  }
  overlay() {
    const race = this.race;
    const path = race ? this.route.slice(0, lastStop(race.player, this.elapsed) + 1) : this.route;
    return {
      markers: this.markers,
      reached: markersReached(this.markers, path),
      path: this.route,
      guide: race?.guide.path,
      head: this.phase === "plan" ? this.route.at(-1) : null,
      player: race ? positionAt(race.player, this.elapsed, this.map) : null,
      scout: race ? positionAt(race.guide, this.elapsed, this.map) : null,
    };
  }
  mount() {
    const a = assignments[this.map.id];
    $("dispatchBrief").innerHTML =
      `<div class="cargo-mark" aria-hidden="true"><i></i></div><span class="brief-label">隊長の作戦メモ</span><h2></h2><p class="brief-copy"></p><dl><div><dt>積み荷</dt><dd id="cargo"></dd></div><div><dt>目標燃料</dt><dd id="targetFuel"></dd></div><div><dt>自己ベスト</dt><dd id="bestFuel"></dd></div></dl>`;
    $("dispatchBrief").querySelector("h2").textContent = a.title;
    if (this.map.id === "daily")
      $("dispatchBrief").querySelector(".brief-label").textContent = "日替わり依頼 · " + this.map.day;
    $("radioSource").textContent = this.official ? a.sender + "から入電" : "救援隊の訓練場";
    $("subtitle").textContent = this.official
      ? "「" + a.call + "」"
      : "自分で編集した地形で、救援ルートを試そう。";
    $("dispatchBrief").querySelector(".brief-copy").textContent = this.official
      ? a.hint
      : "編集した地図での訓練です。地形に合わせて燃料を節約できる道を探しましょう。";
    $("cargo").textContent = a.cargo;
    $("targetFuel").textContent = this.budget === null ? "到達不能" : this.budget + " 以下";
    $("undoWay").onclick = () => this.undo();
    $("clearWay").onclick = () => this.point(this.map.start);
    $("launch").onclick = () => this.launch();
    $("skipRace").onclick = () => this.finish();
    $("nextQuest").onclick = this.nextQuest;
    $("map").setAttribute("aria-describedby", this.official ? "cellInfo routeNotice questObjectives" : "cellInfo routeNotice");
    this.updateLog();
    this.refresh();
  }
  updateLog() {
    updateMissionBoard(this.map, this.day, this.records, this.medals);
  }
  showObjectives(goals) {
    const list = $("questObjectives");
    list.hidden = !this.official;
    if (list.hidden) return;
    const rows = goals.map((goal) => {
      const row = document.createElement("li");
      row.dataset.met = goal.met;
      row.innerHTML = '<b aria-hidden="true"></b><span><strong></strong><small></small></span>';
      row.querySelector("b").textContent = goal.met ? "★" : "☆";
      row.querySelector("strong").textContent = goal.label;
      const verdict = this.phase === "finished" ? (goal.met ? "達成 · " : "未達 · ") : "";
      row.querySelector("small").textContent = verdict + goal.detail;
      return row;
    });
    list.replaceChildren(...rows);
  }
  updateCounters() {
    const racing = !!this.race;
    $("usedFuel").textContent = racing ? Math.floor(Math.min(this.elapsed, this.plan.fuel)) : this.plan.fuel;
    $("routeSteps").textContent = this.plan.steps;
    $("guideReadout").textContent = racing
      ? Math.floor(Math.min(this.elapsed, this.race.guide.fuel)) + " / " + this.race.guide.fuel
      : "出動後に表示";
    if (racing && this.official) {
      const stop = lastStop(this.plan, this.elapsed);
      if (this.shownStop !== stop) {
        this.shownStop = stop;
        const traveled = { path: this.route.slice(0, stop + 1), fuel: this.plan.times[stop] };
        this.showObjectives(missionObjectives(this.map, traveled, this.markers));
      }
    }
  }
  refresh() {
    const plan = this.phase === "plan",
      finished = this.phase === "finished";
    const ready = this.route.at(-1) === this.map.goal;
    const goals = this.official ? missionObjectives(this.map, this.plan, this.markers) : [];
    this.shownStop = null;
    if (!this.race || !this.official) this.showObjectives(goals);
    this.updateCounters();
    const phase = this.accepted ? this.phase : "briefing";
    const labels = {
      briefing: ["任務を受ける", "受注待ち"],
      plan: ["出動する", ready ? "出動準備完了" : "ルート作成中"],
      running: ["走行を一時停止", "走行中"],
      paused: ["走行を再開", "一時停止"],
      finished: ["ルートを編集", "配送完了"],
    };
    const [action, status] = labels[phase];
    $("launch").textContent = action;
    $("status").textContent = status;
    $("launch").disabled = this.accepted && plan && !ready;
    $("undoWay").disabled = $("clearWay").disabled = !plan || this.route.length < 2;
    $("skipRace").hidden = plan || finished;
    $("routeNotice").textContent = this.notice || this.routeMessage(ready);
    $("status").dataset.on = String(this.phase === "running");
    $("guideName").textContent = lessons[this.rule].title;
    for (const button of document.querySelectorAll("[data-rule]"))
      button.disabled = this.phase === "running" || this.phase === "paused";
    $("bestFuel").textContent = this.official ? (this.records[recordKey(this.map)] ?? "未走行") : "訓練走行";
    const report = $("raceReport");
    report.hidden = !finished;
    if (finished) {
      const diff = this.plan.fuel - this.race.guide.fuel;
      const stars = goals.filter((goal) => goal.met).length;
      const a = assignments[this.map.id];
      $("award").hidden = $("nextQuest").hidden = !this.official;
      $("award").dataset.stars = stars;
      $("award").textContent = "★".repeat(stars);
      $("deliveryTitle").textContent = this.official
        ? ranks[stars] + "獲得！ " + (stars === 3 ? "「" + a.medal + "」" : a.title + " クリア")
        : "訓練走行完了";
      $("deliveryReply").textContent = this.official ? a.sender + "「" + a.reply + "」" : "";
      $("deliveryStats").textContent =
        "あなた " +
        this.plan.steps +
        "歩・燃料" +
        this.plan.fuel +
        " ／ " +
        lessons[this.rule].title +
        " " +
        this.result.steps +
        "歩・燃料" +
        this.result.cost;
      $("deliveryTip").textContent =
        (diff === 0
          ? "先導車と同じ燃料で到着。"
          : diff > 0
            ? "先導車より燃料を" + diff + "多く使いました。"
            : "先導車より燃料を" + -diff + "節約できました。") +
        (this.plan.fuel > this.budget
          ? " 砂地1マスの燃料は平地4マス分です。迂回する道も試しましょう。"
          : " 別の探索方式を選ぶと、道の選び方も比べられます。");
    }
    this.redraw();
  }

  routeMessage(ready) {
    if (!this.accepted) return "到着で銅章。追加条件を1つ達成すると銀章、両方達成すると金章！";
    if (this.budget === null) return "この地形ではGに到達できません。地図エディタで通路を作ってください。";
    if (this.phase === "finished")
      return this.official ? "配送完了。3つの条件を振り返ってみよう。" : "訓練終了。先導車と走行結果を比べてみよう。";
    if (this.phase !== "plan") return "金の救援車があなたの道、青の先導車が探索方式の道を走ります。";
    if (!ready) return "SからGへ。直線の先をタップし、曲がり角で次の方向を選びます。";
    const balance = this.plan.fuel - this.budget;
    const forecast = balance > 0 ? "目標より" + balance + "多い計画です。" : "目標以内の計画です。";
    return "Gまで燃料" + this.plan.fuel + "。" + forecast + "出動して比べましょう。";
  }
}
