import { graphView } from "./graph-view.js";

export const beginnerCourse = [
  {
    id: "linear", goal: "順に探す",
    intro: "番号札を左から1枚ずつめくって、目当ての番号を探します。札の下の「位置」は、左端を0として数えます。",
    prompt: "目当ての数は何枚目にありますか？ 数えた枚数と、返ってくる位置を比べてみましょう。",
  },
  {
    id: "binary", goal: "半分に絞る",
    intro: "番号札が小さい順に並んでいたら、真ん中の1枚がヒントになります。そこより小さい番号はすべて左にあります。",
    prompt: "中央の数と探す数を比べましょう。次の一手で、どちら側の札を候補から外せますか？",
  },
  {
    id: "bubble", goal: "隣を比べて並べる",
    intro: "隣り合う2枚の札を見て、左の数が大きければ交換します。端まで繰り返すと、一番大きな札が右端に届きます。",
    prompt: "枠で示した2枚は交換するでしょうか？ 1巡したら、一番大きな数の位置を確かめましょう。",
  },
  {
    id: "bfs", goal: "近い場所から巡る",
    intro: "部屋をつなぐ矢印をたどります。新しく見つけた部屋を待ち列（キュー）の後ろに並べ、先頭の部屋から順に調べます。",
    prompt: "先頭の部屋から矢印をたどると、どの部屋が列の後ろに加わりますか？ 一度見つけた部屋は列に戻しません。",
  },
];

// Give each trace one concrete observation a first-time reader can verify.
export const observationPrompts = {
  prefix: "左端までと右端まで、それぞれの合計に注目しましょう。この2つを引くと、どの区間が残りますか？",
  pointers: "両端の和が目標より小さいとき、次にどちらの端を動かすと和が大きくなりますか？",
  window: "窓が1つ右に動くとき、合計から抜ける数と、新しく加わる数を探しましょう。",
  selection: "まだ並べていない札の中で一番小さい数を覚えておきましょう。次に確定する場所はどこですか？",
  insertion: "手に持った札が key です。左隣の札と比べて、どこまで戻れば小さい順に差し込めますか？",
  merge: "小さい順に並んだ左右の列があります。両方の先頭を見て、次に取り出す数を予想しましょう。",
  quick: "基準の数が pivot です。今見ている数は「小さい・同じ・大きい」のどこに入りますか？",
  heap: "親が子より大きいか同じになるように並べると、先頭に何が来ますか？ その数の移動先を追いましょう。",
  dfs: "矢印をたどった先に未訪問の部屋がなければ、どの部屋まで引き返しますか？",
  topological: "矢印を「先に終わらせる仕事」からの線として読みます。待っている仕事が0件になるのはどれですか？",
  dijkstra: "出発点からの費用を書いたメモが costs です。まだ確定していない地点で、メモの費用が一番小さいのはどこですか？",
  astar: "これまでの歩数が g、壁を無視してゴールまで歩く最短歩数が h です。今のマスで2つを足してみましょう。",
  inorder: "木の一番上から左へたどりましょう。左に枝がないとき、最初に読み取る値は何ですか？",
  stack: "閉じ括弧に出会ったら、まだペアになっていない開き括弧のうち、一番新しいものと組めますか？",
  hash: "同じ数がもう一度出たとき、どの数のカウンターが増えるかを見ましょう。",
  union: "線でつなぐ前から同じ仲間だったら、グループの数は減るでしょうか？ グループ数 groups を追いましょう。",
  interval: "いま選んだ予定の終了時刻を覚えましょう。次の予定は、前の予定が終わってから始まりますか？",
  kruskal: "次に安い線の両端を見ましょう。すでに別の道で行き来できるなら、その線を引く必要はありますか？",
  factorial: "呼び出すたびに数が1つ小さくなります。どの数で折り返し、戻る途中で何を掛けますか？",
  gcd: "大きい数をもう一方で割った余りが remainder です。次の手順で、その余りはどちらの数に入りますか？",
  sieve: "2の倍数を消したあと、3の倍数を調べると、すでに消えた数はどれでしょうか？",
  power: "指数が奇数なら答えに今の掛け数を掛けます。指数が偶数の手順でも答えは変わりますか？",
  subsets: "選んだ数が path に並びます。1通りを記録したあと、末尾の選択を取り消す様子を追いましょう。",
  kmp: "文字が食い違ったとき、探す語のどこから照合をやり直しますか？ 本文の位置 i と見比べましょう。",
  fibonacci: "表の末尾に数が加わる前に、直前の2つを足して次の数を予想しましょう。",
  change: "最後のコインを1枚選んだとします。残りの金額に必要な枚数は、表のどこにありますか？",
  knapsack: "今の品物を積むと残りの容量はいくつですか？ 積む場合と見送る場合で、得点を比べましょう。",
  lcs: "表の上と左の文字を見ましょう。2つの文字が同じとき、左上のマスからいくつ増えますか？",
  edit: "行と列の文字が同じなら、最後の文字はそのまま使えます。そのマスと左上の回数を比べましょう。",
  lis: "今の数を列の末尾にします。左側にある小さな数のうち、どの列の続きにすると一番長くなりますか？",
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function courseOverview(catalog, progressFor) {
  const section = element("section", "course-overview");
  section.setAttribute("aria-labelledby", "courseTitle");
  section.innerHTML = `<div class="course-heading"><div><h2 id="courseTitle">はじめての学習コース</h2>
    <p>4つの教材をひとつずつ。図で次の一手を予想して、最後に1問解いてみましょう。</p></div><span class="course-count"></span></div>
    <ol class="course-stops"></ol><a class="course-start"></a>`;
  const steps = beginnerCourse.map((step) => ({
    ...step,
    status: progressFor(step.id),
    title: catalog.find((lesson) => lesson.id === step.id).title,
  }));
  const next = steps.find((step) => step.status !== "learned");
  const completed = steps.filter((step) => step.status === "learned").length;
  section.querySelector(".course-count").textContent = completed + " / " + steps.length + " 教材クリア";
  for (const [i, step] of steps.entries()) {
    const link = element("a", step === next ? "recommended" : "");
    link.href = "#learn/" + step.id;
    const labels = { learned: "正解済み", review: "要復習" };
    const label = labels[step.status] ?? (step === next ? "ここから" : "未回答");
    link.append(
      element("small", "", `第${i + 1}歩 · ${label}`),
      element("strong", "", step.goal),
      element("span", "", step.title),
    );
    const item = element("li");
    item.append(link);
    section.querySelector("ol").append(item);
  }
  const start = section.querySelector(".course-start");
  start.href = next ? "#learn/" + next.id : "#lab/observe";
  start.textContent = next
    ? next.title + (next.status === "review" ? "を復習する" : "を始める") + " →"
    : "探索ラボで試す →";
  return section;
}

function card(value, label, kind, marker) {
  const tile = element("li", "guide-tile");
  if (kind) tile.classList.add(kind);
  tile.append(element("strong", "", value), element("small", "", label));
  if (marker !== undefined) tile.append(element("small", "tile-marker", marker));
  return tile;
}

function searchCards(id, input, frame, row, previous) {
  const { values, target } = input;
  const { answer } = frame.state;
  const { i, mid, left, right } = frame.action === "結果" ? previous.state : frame.state;
  const current = frame.action === "結果" ? undefined : mid ?? i;
  values.forEach((value, position) => {
    const found = answer === position;
    const outside = answer === -1 || position < (left ?? i ?? 0) || position > (right ?? values.length - 1);
    let label = outside ? "対象外" : "";
    if (found) label = "発見";
    else if (position === current) label = id === "binary" ? "中央" : "照合";
    const kind = found || position === current ? "selected" : outside ? "excluded" : "";
    row.append(card(value, "位置" + position, kind, label));
  });
  if (frame.action === "結果")
    return answer === -1 ? `探す数 ${target} は見つかりませんでした。そこで −1 を返します。`
      : `左から${answer + 1}枚目で ${target} を発見。左端の位置は0なので、返す位置は ${answer} です。`;
  if (!values.length) return "札が0枚です。比べる札がないときの結果を予想してみましょう。";
  if (current === undefined) return `探す数は ${target}。最初にめくるのは${id === "linear" ? "左端の札" : "中央の札（中央が2枚なら左側）"}です。`;
  const value = values[current];
  if (value === target) return `位置 ${current} の ${value} が探す数と一致しました。ここで探索を終えます。`;
  if (id === "linear") return `${value} と ${target} は違います。${i + 1 < values.length ? "次は右隣の札を調べます。" : "右隣に札はありません。"}`;
  const tooSmall = value < target;
  return `中央の ${value} は ${target} より${tooSmall ? "小さい" : "大きい"}ので、中央を含めて${tooSmall ? "左" : "右"}側を候補から外せます。`;
}

function sortCards(input, frame, row) {
  const { end, answer } = frame.state;
  const values = answer ?? frame.state.values ?? input.values;
  values.forEach((v, i) => {
    const active = frame.active.includes(i);
    const fixed = frame.action === "結果" || i > end;
    let label = fixed ? "確定" : "位置" + i;
    if (active) label = i === frame.active[0] ? "左の札" : "右の札";
    row.append(card(v, label, active ? "selected" : fixed ? "settled" : ""));
  });
  if (answer) return `${values.length}枚の札が小さい順に並びました。結果はこの並び全体です。`;
  if (!frame.active.length) return values.length < 2 ? "札が2枚そろわないので、比較は必要ありません。" : "左端の2枚から始めます。左の札が右の札より大きいかを見てみましょう。";
  const [a, b] = frame.active.map((i) => values[i]);
  if (frame.action === "隣同士を交換") return `2枚を交換しました。${b} が右へ動き、${a} が左に来ました。`;
  return `左の ${a} と右の ${b} を比較。${a > b ? "左の方が大きいので、この2枚を交換します。" : "このまま小さい順なので、交換しません。"}`;
}

function queueCards(input, frame, row) {
  const { queue, node, answer } = frame.state;
  const rooms = answer ?? queue ?? [input.start];
  rooms.forEach((room, i) => {
    const label = answer ? (i + 1) + "番目" : i === 0 ? "先頭" : "順番待ち";
    row.append(card(room, label, !answer && i === 0 ? "selected" : ""));
  });
  if (answer) return `出発点 ${input.start} から届く ${answer.length} 部屋を、図の順に訪問しました。`;
  if (!queue) return `丸は部屋、矢印は進める向きです。待ち列に出発点 ${input.start} を入れます。`;
  const neighbors = new Set(input.edges.filter(([from]) => from === node).map(([, to]) => to));
  const additions = [...neighbors].filter((room) => !frame.state.seen.includes(room));
  return `先頭の部屋 ${node} を調べます。${additions.length ? "新しく見つけた " + additions.join("、") + " を、この後で列の末尾に加えます。" : "ここから新しく列に加える部屋はありません。"}`;
}

// Only the first decision gets a prediction, so later steps can be replayed uninterrupted.
function prediction(id, input, frame) {
  const { values, i, mid } = frame.state;
  if (id === "linear") {
    return {
      question: `位置 ${i} の札は ${values[i]}。探す数 ${input.target} と一致しますか？`,
      options: ["一致する", "一致しない"], correct: values[i] === input.target ? 0 : 1,
    };
  }
  if (id === "binary") {
    const center = values[mid];
    return {
      question: `中央の札は ${center}、探す数は ${input.target}。次はどうしますか？`,
      options: ["左側を候補から外す", "右側を候補から外す", "この位置を返す"],
      correct: center === input.target ? 2 : center < input.target ? 0 : 1,
    };
  }
  if (id === "bubble") {
    const [left, right] = frame.active.map((index) => values[index]);
    return {
      question: `左に ${left}、右に ${right}。この2枚をどうしますか？`,
      options: ["交換する", "このまま進む"], correct: left > right ? 0 : 1,
    };
  }
  return {
    question: "この部屋から新しく行ける部屋を見つけたら、待ち列のどこに加えますか？",
    options: ["先頭に入れる", "末尾に並べる"], correct: 1,
  };
}

function askPrediction(figure, decision, explanation) {
  const caption = element("figcaption", "", decision.question);
  const choices = element("div", "actions prediction-choices");
  const feedback = element("p", "prediction-feedback");
  feedback.setAttribute("role", "status");
  for (const [index, label] of decision.options.entries()) {
    const button = element("button", "", label);
    button.type = "button";
    button.setAttribute("aria-pressed", "false");
    button.onclick = () => {
      const correct = index === decision.correct;
      feedback.textContent = (correct ? "正解。 " : "もう一度考えてみよう。 ") + explanation;
      for (const choice of choices.children) choice.setAttribute("aria-pressed", String(choice === button));
    };
    choices.append(button);
  }
  caption.append(choices, feedback);
  figure.append(caption);
}

export function courseDiagram(id, trace, index, ask) {
  const input = trace.frames[0].state;
  const frame = trace.frames[index];
  const figure = element("figure", "course-diagram");
  const row = element("ol", "guide-tiles");
  const isGraph = id === "bfs";
  let title, caption;
  if (isGraph) {
    figure.append(graphView(id, input, frame.state));
    title = frame.action === "結果" ? "訪問した順番" : "部屋の待ち列";
    caption = queueCards(input, frame, row);
  } else if (id === "bubble") {
    title = "札の並び";
    caption = sortCards(input, frame, row);
  } else {
    title = "探す数　" + input.target;
    caption = searchCards(id, input, frame, row, trace.frames[index - 1]);
  }
  figure.append(element("div", "diagram-label", title));
  if (row.childElementCount) {
    row.setAttribute("aria-label", title);
    figure.append(row);
  } else figure.append(element("p", "empty-row", "札は0枚"));
  if (ask && index === 1 && frame.action !== "結果") {
    const explanation = isGraph ? "待っていた部屋を先に訪ねるため、新しい部屋は末尾に加えます。" + caption : caption;
    askPrediction(figure, prediction(id, input, frame), explanation);
  } else figure.append(element("figcaption", "", caption));
  return figure;
}
