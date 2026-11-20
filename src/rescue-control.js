import {
  assignments,
  extendRoute,
  fileDelivery,
  isOfficial,
  itinerary,
  loadRecords,
  mapKey,
  positionAt,
  recordKey,
} from "./expedition.js";
import { calendarDay } from "./daily-map.js";
import { lessons } from "./lessons.js";

const pace = 120; // Real milliseconds per unit of simulated fuel.
const $ = (id) => document.getElementById(id);

export class RescueControl {
  constructor(redraw) {
    this.redraw = redraw;
    try {
      this.storage = window.localStorage;
    } catch {
      /* The log can be session-only. */
    }
    this.records = loadRecords(this.storage);
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
    } else if (rule !== this.rule) {
      this.resetClock();
      this.notice = "";
    }
    this.map = map;
    this.rule = rule;
    this.result = result;
    this.official = isOfficial(map);
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
      this.elapsed = Math.max(0,Math.min(this.duration(), (time - start) / pace));
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
    if (!this.race) return;
    cancelAnimationFrame(this.animation);
    this.elapsed = this.duration();
    this.phase = "finished";
    this.records = fileDelivery(this.records, this.map, this.plan.fuel, this.storage);
    this.refresh();
  }
  overlay() {
    const race = this.race;
    return {
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
      `<div class="cargo-mark" aria-hidden="true"><i></i></div><span class="brief-label">救援依頼</span><h2></h2><p class="brief-copy"></p><dl><div><dt>積み荷</dt><dd id="cargo"></dd></div><div><dt>目標燃料</dt><dd id="targetFuel"></dd></div><div><dt>自己ベスト</dt><dd id="bestFuel"></dd></div></dl><div class="stamp-log" aria-label="各地の救援記録"></div>`;
    $("dispatchBrief").querySelector("h2").textContent = a.title;
    if (this.map.id === "daily")
      $("dispatchBrief").querySelector(".brief-label").textContent = "日替わり依頼 · " + this.map.day;
    $("subtitle").textContent = this.official
      ? this.map.name + "へ" + a.cargo + "を届けよう。目標は燃料" + this.budget + "以内。"
      : "自分で編集した地形で、救援ルートを試そう。";
    $("dispatchBrief").querySelector(".brief-copy").textContent = this.official
      ? a.call
      : "編集した地図での訓練です。地形に合わせて燃料を節約できる道を探しましょう。";
    $("cargo").textContent = a.cargo;
    $("targetFuel").textContent = this.budget === null ? "到達不能" : this.budget + " 以下";
    $("undoWay").onclick = () => this.undo();
    $("clearWay").onclick = () => this.point(this.map.start);
    $("launch").onclick = () => this.launch();
    $("skipRace").onclick = () => this.finish();
    this.refresh();
  }
  updateCounters() {
    const racing = !!this.race;
    $("usedFuel").textContent = racing ? Math.floor(Math.min(this.elapsed, this.plan.fuel)) : this.plan.fuel;
    $("routeSteps").textContent = this.plan.steps;
    $("guideReadout").textContent = racing
      ? Math.floor(Math.min(this.elapsed, this.race.guide.fuel)) + " / " + this.race.guide.fuel
      : "出動後に表示";
  }
  refresh() {
    const plan = this.phase === "plan",
      finished = this.phase === "finished";
    const ready = this.route.at(-1) === this.map.goal;
    this.updateCounters();
    $("launch").textContent = plan
      ? "出動する"
      : finished
        ? "ルートを編集"
        : this.phase === "paused"
          ? "走行を再開"
          : "走行を一時停止";
    $("launch").disabled = plan && !ready;
    $("undoWay").disabled = $("clearWay").disabled = !plan || this.route.length < 2;
    $("skipRace").hidden = plan || finished;
    const balance = this.plan.fuel - this.budget;
    const forecast = balance > 0 ? "目標より" + balance + "多い計画です。" : "目標以内の計画です。";
    $("routeNotice").textContent =
      this.notice ||
      (this.budget === null
        ? "この地形ではGに到達できません。地図エディタで通路を作ってください。"
        : plan
          ? ready
            ? "Gまで燃料" + this.plan.fuel + "。" + forecast + "出動して比べましょう。"
            : "SからGへ。直線の先をタップし、曲がり角で次の方向を選びます。"
          : finished
            ? "配送完了。あなたは燃料" + this.plan.fuel + "、先導車は" + this.result.cost + "で到着しました。"
            : "金の救援車があなたの道、青の先導車が探索方式の道を走ります。");
    $("status").textContent = plan
      ? ready
        ? "出動準備完了"
        : "ルート作成中"
      : finished
        ? "配送完了"
        : this.phase === "paused"
          ? "一時停止"
          : "走行中";
    $("status").dataset.on = String(this.phase === "running");
    $("guideName").textContent = lessons[this.rule].title;
    for (const button of document.querySelectorAll("[data-rule]"))
      button.disabled = this.phase === "running" || this.phase === "paused";
    $("bestFuel").textContent = this.official ? (this.records[recordKey(this.map)] ?? "未走行") : "訓練走行";
    const log = $("dispatchBrief").querySelector(".stamp-log");
    log.replaceChildren();
    let cleared = 0;
    for (const [id, label] of [
      ["river", "川辺"],
      ["sand", "砂丘"],
      ["pass", "峠"],
      ["daily", "本日"],
    ]) {
      const record = id === "daily" ? "daily-" + (this.map.day ?? calendarDay()) : id;
      const achieved = this.records[record] <= assignments[id].budget;
      if (achieved) cleared++;
      const stamp = document.createElement("span");
      stamp.className = achieved ? "earned" : "";
      stamp.textContent = (achieved ? "✓ " : "◇ ") + label;
      stamp.title = achieved ? "目標燃料で配送済み" : "目標燃料で届けると記録されます";
      log.append(stamp);
    }
    $("progress").textContent = cleared + " / 4";
    const report = $("raceReport");
    report.hidden = !finished;
    if (finished) {
      const diff = this.plan.fuel - this.race.guide.fuel;
      $("deliveryTitle").textContent =
        this.plan.fuel <= this.budget ? "目標燃料で配送成功！" : "物資を届けました";
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
}
