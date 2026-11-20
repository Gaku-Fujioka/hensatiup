import { drills, checkDrill } from "./drills.js";

function read(id) {
  try {
    return JSON.parse(localStorage.getItem("routelab.drill." + id)) || {};
  } catch {
    return {};
  }
}
function write(id, data) {
  try {
    localStorage.setItem("routelab.drill." + id, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
function textOf(value) {
  return typeof value === "number" && !Number.isFinite(value) ? String(value) : JSON.stringify(value);
}
export function openDrill(root, id) {
  const drill = drills.find((d) => d.id === id) ?? drills[0];
  const saved = read(drill.id);
  root.innerHTML = `<a class="back-link" href="#library">図鑑の一覧へ</a>
    <div class="lib-heading"><div><small class="group-name">実装ドリル</small><h1></h1><p class="assignment"></p></div>
    <label class="map-select">課題<select id="chooseDrill"></select></label></div>
    <div class="study-grid"><section class="study-panel"><h2>空欄に入る式</h2><form>
    <label for="drillInput" class="variables"></label><input id="drillInput" class="expression" maxlength="140" placeholder="ここに式を書く" autocomplete="off" spellcheck="false">
    <button class="primary">テストを実行</button></form><p class="verdict" role="status"></p>
    <details><summary>使える演算</summary><p>数値・表示された変数・括弧、四則演算と %、比較 &lt; &lt;= &gt; &gt;= === !==、Math.min と Math.max が使えます。</p></details>
    <details><summary>ヒントを見る</summary><p class="drill-hint"></p><details><summary>解答例を確認</summary><code class="solution"></code></details></details>
    <p><a class="text-link reference"></a></p></section>
    <section class="source-panel"><h2>式を組み込んだ実装</h2><p>入力した式を使って、下の4ケースを実行します。</p><pre tabindex="0"><code id="drillCode"></code></pre></section></div>
    <section class="study-panel compare-results"><h2>テストケース</h2><div id="drillCases"></div></section>`;
  const get = (s) => root.querySelector(s),
    select = get("#chooseDrill"),
    field = get("#drillInput"),
    message = get(".verdict");
  document.title = drill.title + " · RouteLab";
  get("h1").textContent = drill.title;
  get(".assignment").textContent = drill.task;
  get(".variables").textContent = "使える変数　" + drill.names.join(", ");
  get(".reference").textContent = "この考え方を図鑑で読む";
  get(".reference").href = "#learn/" + drill.id;
  get(".drill-hint").textContent = drill.hint;
  get(".solution").textContent = drill.answer;
  for (const item of drills) select.add(new Option(item.title + (read(item.id).passed ? " ✓" : ""), item.id));
  select.value = drill.id;
  select.onchange = () => (location.hash = "#drill/" + select.value);
  field.value = typeof saved.draft === "string" ? saved.draft : "";
  function preview() {
    get("#drillCode").textContent = drill.solve
      .toString()
      .replace(/,\s*blank\)/, ")")
      .replace(/blank\(\{[\w,\s]+\}\)/, () => "(" + (field.value.trim() || "＿＿＿") + ")");
  }
  function cases(results) {
    const list = get("#drillCases");
    list.replaceChildren();
    drill.cases.forEach(([input, expected], i) => {
      const item = document.createElement("article");
      item.className = "case-row";
      const data = document.createElement("code"),
        answer = document.createElement("span"),
        outcome = document.createElement("b");
      data.textContent = JSON.stringify(input);
      answer.textContent = "期待値　" + textOf(expected);
      const result = results?.[i];
      outcome.textContent = result
        ? (result.passed ? "成功" : "失敗") + " · " + (result.error ?? textOf(result.actual))
        : "未実行";
      item.append(data, answer, outcome);
      list.append(item);
    });
  }
  field.oninput = () => {
    saved.draft = field.value;
    write(drill.id, saved);
    preview();
    cases();
    message.textContent = "";
  };
  get("form").onsubmit = (e) => {
    e.preventDefault();
    try {
      const results = checkDrill(drill, field.value),
        passed = results.filter((r) => r.passed).length;
      cases(results);
      message.textContent =
        passed === results.length
          ? "全ケース成功。実装できました。"
          : passed + " / " + results.length + " 件成功。失敗した入力と期待値を見比べてください。";
      if (passed === results.length) {
        saved.passed = true;
        saved.draft = field.value;
        const stored = write(drill.id, saved);
        select.selectedOptions[0].textContent = drill.title + " ✓";
        if (!stored) message.textContent += " この環境では記録を保存できません。";
      }
    } catch (error) {
      cases();
      message.textContent = error.message;
    }
  };
  preview();
  cases();
}
