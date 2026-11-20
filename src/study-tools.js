import { catalog } from "./catalog.js";
import { runLesson } from "./trace.js";

// Each answer explains a decision a learner can verify in the trace.
export const questions = {
  linear: [
    "[8,3,8] から 8 を探すと、返る位置は？",
    ["0", "2", "3"],
    0,
    "先頭の位置0で一致した時点で関数を抜けます。",
  ],
  binary: [
    "中央の値が探す値より小さいとき、次に残すのは？",
    ["中央より左", "中央より右", "中央だけ"],
    1,
    "昇順なので、中央とその左にある値はすべて小さすぎます。",
  ],
  prefix: [
    "累積和が [0,4,6,13]。元の区間 [1,3) の和は？",
    ["13", "9", "6"],
    1,
    "右端までの13から、左端より前の4を引きます。",
  ],
  pointers: [
    "昇順の両端の和が目標より大きいときは？",
    ["左端を右へ", "両端を固定", "右端を左へ"],
    2,
    "大きい側を小さくすれば、和を減らせます。",
  ],
  window: [
    "幅3の窓 [2,5,1] に続く値が4。次の合計は？",
    ["10", "12", "6"],
    0,
    "前の和8から外れる2を引き、入る4を足します。",
  ],
  bubble: [
    "1巡目が終わったとき、右端にあるのは？",
    ["最小値", "最大値", "中央値"],
    1,
    "右への隣接交換を繰り返すと、最大値が右端まで運ばれます。",
  ],
  selection: [
    "5個の整列済み配列で、最小候補の比較は何回？",
    ["0回", "4回", "10回"],
    2,
    "未整列部分を毎回調べるので、4+3+2+1=10回です。",
  ],
  insertion: [
    "等しい値の左側で比較を打ち切るのはなぜ？",
    ["同値の順序を保てる", "配列が空になる", "降順にするため"],
    0,
    "先に現れた同値要素の後ろに新しい要素を挿入できます。",
  ],
  merge: [
    "左右の先頭が同じとき、左から採ると何が保たれる？",
    ["配列の長さだけ", "同値要素の元の順序", "基準値の位置"],
    1,
    "もとの配列では左半分の要素が先にありました。",
  ],
  quick: [
    "先頭を基準にするこの実装が片寄りやすい入力は？",
    ["中央が最大の列", "すべて同じ値", "昇順の異なる値"],
    2,
    "毎回最小値が基準になり、小グループが空のまま再帰が続きます。",
  ],
  heap: [
    "最大ヒープの根を未確定範囲の末尾に移すと？",
    ["その末尾が確定する", "左の子が最小になる", "全体が整列する"],
    0,
    "未確定部分の最大値なので、次回は末尾を除いてヒープを直します。",
  ],
  bfs: [
    "無重みグラフで近い頂点から処理するために使うものは？",
    ["スタック", "キュー", "最大ヒープ"],
    1,
    "先に発見した頂点から取り出すと、同じ距離の層が順番に広がります。",
  ],
  dfs: [
    "閉路で同じ頂点に何度も入るのを防ぐには？",
    ["辺を逆転する", "常に小さい番号を選ぶ", "訪問済みを記録する"],
    2,
    "再帰で隣へ潜る前に記録するので、戻ってきた辺でも止まります。",
  ],
  topological: [
    "すべての頂点を処理する前に候補が尽きたら？",
    ["閉路がある", "正しい順序が一意", "辺が1本もない"],
    0,
    "残った頂点に入次数0の候補がないので、循環依存を解消できません。",
  ],
  dijkstra: [
    "このダイクストラ法で重みとして使えるのは？",
    ["正の値だけ", "0以上の値", "負の値も含む任意の数"],
    1,
    "確定後に安くなる経路を作らないため、辺は非負である必要があります。",
  ],
  astar: [
    "ここで h が残りコスト以下になる理由は？",
    ["壁を自由に通れる", "対角線にも進める", "上下左右に各1で進む"],
    2,
    "障害物を除いても、目的地との縦横の差だけの歩数が必要です。",
  ],
  inorder: [
    "中順走査で昇順の値が得られる木は？",
    ["二分探索木", "すべての二分木", "完全二分木なら必ず"],
    0,
    "各節点で左の値が小さく、右の値が大きいという探索木の性質を使います。",
  ],
  stack: [
    "([)] が失敗するのはどの文字を読んだとき？",
    ["2番目の [", "3番目の )", "最後の ]"],
    1,
    "直前に開いた [ を閉じられるのは ] です。個数だけでは照合できません。",
  ],
  hash: [
    "[4,2,4] を集計した直後、キー4の値は？",
    ["4", "1", "2"],
    2,
    "キーは商品ID、値は出現回数です。4は2回登場しました。",
  ],
  union: [
    "同じ集合に属する2点をもう一度結ぶと集合数は？",
    ["変わらない", "1減る", "2増える"],
    0,
    "両端の代表が同じなら、新しい集合の併合は起きません。",
  ],
  interval: [
    "1室に最多件数を入れるときの選択基準は？",
    ["開始が早い予定", "終了が早い予定", "長い予定"],
    1,
    "早く終えると、次に使える空き時間を最も広く残せます。",
  ],
  kruskal: [
    "最も安い未処理の辺でも採用しないのは？",
    ["重みが0のとき", "端点の番号が大きいとき", "両端がすでに連結のとき"],
    2,
    "その辺を足すと閉路になり、新しい頂点群をつなげません。",
  ],
  factorial: [
    "0! を1とする分岐の役割は？",
    ["再帰を止め、積を返し始める", "奇数を省く", "引数を負にする"],
    0,
    "停止条件から1が返れば、待っている呼び出しが順に積を計算できます。",
  ],
  gcd: [
    "84 と30の次に調べる組は？",
    ["30 と54", "30 と24", "84 と24"],
    1,
    "84を30で割った余り24に置き換えても最大公約数は同じです。",
  ],
  sieve: [
    "素数5の倍数への印付けを25から始められる理由は？",
    ["25より小さい数はすべて素数", "5が奇数だから", "小さい倍数は前の素数で処理済み"],
    2,
    "10、15、20は2または3の倍数として先に除かれます。",
  ],
  power: [
    "指数が奇数の回に答えへ factor を掛ける理由は？",
    ["2で割った余り1の分を残す", "指数を偶数倍する", "常に負の値にする"],
    0,
    "指数 2k+1 の累乗は、底1つと、底の二乗のk乗に分解できます。",
  ],
  subsets: [
    "異なる3要素の部分集合は空集合を含めて何個？",
    ["6", "8", "9"],
    1,
    "それぞれ選ぶ・選ばないの2通りがあり、2×2×2です。",
  ],
  kmp: [
    "不一致の後に接頭辞表を使って戻すのは？",
    ["本文の先頭位置", "本文の長さ", "パターン側の一致長"],
    2,
    "一致済み部分の末尾と先頭が重なる長さを使って、本文を読み直さず続けます。",
  ],
  fibonacci: [
    "F(4)=3、F(5)=5 の次の項は？",
    ["8", "15", "2"],
    0,
    "直前の2項を足します。表に保存しておけば同じ項を再計算しません。",
  ],
  change: [
    "額面1,3,4で6を作る最少枚数は？",
    ["3枚", "2枚", "1枚"],
    1,
    "3+3 の2枚です。4を最初に選んだ場合の4+1+1より少なくなります。",
  ],
  knapsack: [
    "容量を小さい方から更新すると起き得る問題は？",
    ["品物がすべて消える", "容量の単位が変わる", "同じ品物を再利用してしまう"],
    2,
    "この品物で更新したばかりの小さい容量を、同じ周回で参照するためです。",
  ],
  lcs: [
    "ABC と AC の最長共通部分列の長さは？",
    ["2", "1", "3"],
    0,
    "途中のBを飛ばしてACが共通です。連続している必要はありません。",
  ],
  edit: ["cat を cut にする編集距離は？", ["0", "1", "2"], 1, "aをuに1回置換します。"],
  lis: [
    "[2,2,2] の厳密な増加部分列の最大長は？",
    ["3", "2", "1"],
    2,
    "同じ値は増加ではないので、どれか1個だけを選びます。",
  ],
};

const key = "routelab.study.v1";
let memory = {};
function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && typeof saved === "object" && !Array.isArray(saved)) memory = saved;
  } catch {}
  return memory;
}
export function progressFor(id) {
  return read()[id];
}
export function mastery() {
  const data = read();
  return catalog.filter((l) => data[l.id] === "learned").length;
}
function record(id, status) {
  const data = { ...read(), [id]: status };
  memory = data;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function practice(slot, lesson, onChange) {
  const [question, options, correct, reason] = questions[lesson.id];
  slot.innerHTML =
    '<section class="practice-card"><h2>理解度チェック</h2><p class="prompt"></p><div class="actions"></div><p class="check-answer" role="status"></p></section>';
  slot.querySelector(".prompt").textContent = question;
  const answer = slot.querySelector(".check-answer");
  if (progressFor(lesson.id) === "learned")
    answer.textContent = "前回のチェックは正解でした。もう一度挑戦できます。";
  options.forEach((option, i) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.onclick = () => {
      const passed = i === correct;
      const saved = record(lesson.id, passed ? "learned" : "review");
      answer.textContent =
        (passed ? "正解。" : "復習リストに追加しました。") +
        reason +
        (saved ? "" : " このタブ内で記録しています。");
      for (const child of slot.querySelectorAll("button"))
        child.setAttribute("aria-pressed", String(child === button));
      onChange();
    };
    slot.querySelector(".actions").append(button);
  });
}

export function comparisonView(root, openInput) {
  root.innerHTML = `<a class="back-link" href="#library">図鑑の一覧へ</a><div class="lib-heading"><div><h1>ソート比較実験</h1><p>6つの実装に同じ配列を渡し、値同士を何回比較したか見比べます。</p></div></div>
  <section class="study-panel comparison-panel"><h2>比較する配列</h2><form><label for="sortInput">整数をカンマで区切って入力</label><input id="sortInput" value="7, 2, 5, 2, 9, 1" maxlength="100"><div class="actions presets"><button type="button">昇順</button><button type="button">逆順</button><button type="button">同じ値</button><button type="button">ほぼ整列</button></div><button class="primary">6方式を比較</button><p class="input-error" role="alert"></p></form></section>
  <section class="study-panel compare-results"><h2>実測した比較回数</h2><p class="hint">棒の長さはこの入力での回数です。ループ条件と添字の比較は数えません。</p><div id="sortRows"></div><p id="sortedAnswer" class="answer-line"></p></section>`;
  const input = root.querySelector("#sortInput");
  function compare() {
    try {
      const raw = input.value.trim(),
        items = raw ? raw.split(/[,、，]/).map((s) => s.trim()) : [];
      if (items.some((item) => !/^[-+]?\d+$/.test(item))) throw new Error("整数をカンマで区切ってください。");
      const values = items.map(Number);
      const results = catalog
        .filter((l) => l.group === "ソート")
        .map((lesson) => ({ lesson, ...runLesson(lesson, { values }) }));
      const max = Math.max(1, ...results.map((r) => r.comparisons));
      const rows = root.querySelector("#sortRows");
      rows.replaceChildren();
      for (const { lesson, comparisons } of results) {
        const row = document.createElement("div");
        row.className = "sort-row";
        const link = document.createElement("a");
        link.textContent = lesson.title;
        link.href = "#learn/" + lesson.id;
        link.onclick = () => openInput(lesson.id, { values });
        const bar = document.createElement("span");
        bar.className = "sort-meter";
        const fill = document.createElement("i");
        fill.style.width = (comparisons / max) * 100 + "%";
        bar.append(fill);
        const amount = document.createElement("b");
        amount.textContent = comparisons + " 回";
        row.append(link, bar, amount);
        rows.append(row);
      }
      root.querySelector("#sortedAnswer").textContent =
        "共通の整列結果　" + JSON.stringify(results[0].answer);
      root.querySelector(".input-error").textContent = "";
    } catch (error) {
      root.querySelector(".input-error").textContent = error.message + " 結果は前回の入力です。";
    }
  }
  const presets = [
    [1, 2, 3, 4, 5, 6, 7, 8],
    [8, 7, 6, 5, 4, 3, 2, 1],
    [4, 4, 4, 4, 4, 4, 4, 4],
    [1, 2, 3, 5, 4, 6, 7, 8],
  ];
  root.querySelectorAll(".presets button").forEach(
    (b, i) =>
      (b.onclick = () => {
        input.value = presets[i].join(", ");
        compare();
      }),
  );
  root.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    compare();
  };
  compare();
}
