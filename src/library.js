import { catalog } from "./catalog.js";
import { runLesson } from "./trace.js";

const root = document.getElementById("library");
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const local = selector => root.querySelector(selector);
const valueText = value => typeof value === "string" ? value : JSON.stringify(value);
let query = "", group = "すべて", playback;
export function stopLibrary() { clearInterval(playback); playback = null; }

function list() {
  root.innerHTML = `<div class="lib-heading"><div><h1>アルゴリズム図鑑</h1><p>考え方を読み、入力を変えて、コードの動きを確かめよう。</p></div></div>
    <a class="feature-lesson" href="#learn/binary"><div><small>最初のレッスン</small><h2>二分探索</h2><p>中央の値を見ると、なぜ候補が半分になる？</p></div><div class="feature-cells" aria-hidden="true"><i>1</i><i>3</i><i>4</i><i>7</i><i>11</i></div></a>
    <div class="catalog-tools"><label>教材を検索<input type="search" placeholder="例：ソート、区間、名簿" id="findLesson"></label><label>分野<select id="lessonGroup"></select></label></div>
    <p class="catalog-count" role="status"></p><div class="catalog-grid"></div>`;
  const search = local("#findLesson"), select = local("#lessonGroup");
  for (const name of ["すべて", ...new Set(catalog.map(l=>l.group))]) select.add(new Option(name,name));
  search.value=query;select.value=group;
  function filter() {
    const grid=local(".catalog-grid");
    grid.replaceChildren();
    const term=query.trim().toLowerCase();
    for (const lesson of catalog) {
      if ((group!=="すべて" && group!==lesson.group) ||
        ![lesson.title,lesson.group,lesson.id,lesson.idea,lesson.use,lesson.solve.name].join(" ").toLowerCase().includes(term)) continue;
      const card=el("a","lesson-card");
      card.href="#learn/"+lesson.id;
      card.append(el("small","group-name",lesson.group),el("h2","",lesson.title),el("p","",lesson.use),el("span","time-tag",lesson.time));
      grid.append(card);
    }
    local(".catalog-count").textContent=grid.children.length+" / "+catalog.length+" 教材";
    if(!grid.children.length) grid.append(el("p","","一致する教材がありません。分野や検索語を変えてみてください。"));
  }
  search.oninput=()=>{query=search.value;filter();};select.onchange=()=>{group=select.value;filter();};
  filter();
}

function showLesson(lesson) {
  root.innerHTML=`<a class="back-link" href="#library">図鑑の一覧へ</a><div class="lib-heading"><div><small class="group-name"></small><h1></h1><p class="lesson-idea"></p></div><span class="time-tag"></span></div>
    <div class="lesson-context"><div><h2>使いどころ</h2><p class="use"></p></div><div><h2>覚えておくこと</h2><p class="note"></p></div></div>
    <div class="study-grid"><section class="study-panel experiment"><h2>実行を観察</h2><form><label for="lessonInput">入力データ <small>JSON</small></label><textarea id="lessonInput" rows="3" spellcheck="false"></textarea>
    <div class="actions"><button class="primary">この入力で実行</button><button type="button" id="restoreInput">例に戻す</button></div><p class="input-error" role="alert"></p></form>
    <div class="trace-area"><h3 id="traceName"></h3><div id="traceState"></div></div><label class="step-label" for="traceSeek">ステップ <output id="traceCount"></output></label><input type="range" id="traceSeek" min="0" value="0"><div class="actions"><button id="tracePlay">再生</button><button id="tracePrev">戻る</button><button id="traceNext">進む</button><button id="traceEnd">結果へ</button></div>
    <p class="answer-line">戻り値 <code id="answer"></code></p></section>
    <section class="source-panel"><div class="source-head"><h2>JavaScript 実装</h2><button id="copySource">コピー</button></div><p>色の付いた行で、その時点の変数を記録しています。</p><pre tabindex="0" aria-label="JavaScriptコード"><code id="lessonSource"></code></pre><span id="copyStatus" role="status"></span></section></div>
    <div id="practiceSlot"></div><div class="lesson-pagination"><a href="#library">全教材を見る</a><a id="nextLesson"></a></div>`;
  local("h1").textContent=lesson.title;local(".group-name").textContent=lesson.group;
  for (const [selector,key] of [[".lesson-idea","idea"],[".time-tag","time"],[".use","use"],[".note","note"]]) local(selector).textContent=lesson[key];
  const next=catalog[catalog.indexOf(lesson)+1];
  const nextLink=local("#nextLesson");
  if(next){nextLink.href="#learn/"+next.id;nextLink.textContent="次の教材 · "+next.title;}else nextLink.remove();
  const input=local("#lessonInput"), seek=local("#traceSeek"), source=local("#lessonSource");
  input.value=JSON.stringify(lesson.example,null,0);
  let trace, index=0;
  function show() {
    const frame=trace.frames[index];
    seek.value=index;local("#traceCount").textContent=index+" / "+(trace.frames.length-1);
    local("#traceName").textContent=frame.action;local("#tracePrev").disabled=index===0;
    local("#traceNext").disabled=local("#traceEnd").disabled=index===trace.frames.length-1;
    local("#tracePlay").textContent=playback?"一時停止":"再生";
    const state=local("#traceState");state.replaceChildren();
    let firstArray=true;
    for(const [name,value] of Object.entries(frame.state)){
      const row=el("div","var-row");row.append(el("b","var-name",name));
      if(Array.isArray(value)){
        const cells=el("div","value-cells");
        value.forEach((v,i)=>cells.append(el("span",firstArray && frame.active.includes(i)?"active":"",valueText(v))));
        if(!value.length)cells.append(el("span","","[ ]"));
        firstArray=false;row.append(cells);
      }else row.append(el("code","",valueText(value)));
      state.append(row);
    }
    for(let i=0;i<source.children.length;i++)source.children[i].classList.toggle("current",i===frame.line);
    local("#answer").textContent=index===trace.frames.length-1?valueText(trace.answer):"最後のステップで確認";
  }
  function go(to){stopLibrary();index=to;show();}
  function run(){
    stopLibrary();
    try {
      let data;
      try { data=JSON.parse(input.value); } catch {throw new Error("JSONの形式を確認してください。キーは二重引用符で囲みます。");}
      const updated=runLesson(lesson,data);
      trace=updated;
      source.replaceChildren(...trace.source.map((line,i)=>{const row=el("span","source-row");row.append(el("i","",i+1),document.createTextNode(line+"\n"));return row;}));
      local(".input-error").textContent="";seek.max=trace.frames.length-1;go(0);
    }catch(error){show();local(".input-error").textContent=error.message+" 表示中の手順は前回の入力です。";}
  }
  local("form").onsubmit=e=>{e.preventDefault();run();};
  local("#restoreInput").onclick=()=>{input.value=JSON.stringify(lesson.example);run();};
  local("#traceNext").onclick=()=>go(index+1);local("#tracePrev").onclick=()=>go(index-1);
  local("#traceEnd").onclick=()=>go(trace.frames.length-1);seek.oninput=()=>go(Number(seek.value));
  local("#tracePlay").onclick=()=>{
    if(playback){go(index);return;}
    if(index===trace.frames.length-1)index=0;
    playback=setInterval(()=>{index++;if(index===trace.frames.length-1)stopLibrary();show();},550);show();
  };
  local("#copySource").onclick=async()=>{
    try{await navigator.clipboard.writeText(lesson.solve.toString());local("#copyStatus").textContent="コピーしました。";}
    catch{local("#copyStatus").textContent="コードを選択してコピーしてください。";}
  };
  run();
}
export function openLibrary(hash) {
  stopLibrary();
  const lesson=catalog.find(l=>hash==="#learn/"+l.id);
  if(lesson) showLesson(lesson);else list();
  document.title=(lesson?.title || "アルゴリズム図鑑")+" · RouteLab";
}
