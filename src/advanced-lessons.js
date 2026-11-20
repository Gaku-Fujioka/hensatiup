import { integer, integers, requireInput } from "./trace.js";

function factorial({ n }, observe = () => {}) {
  function product(k) {
    if (k === 0) return 1;
    observe("小さい問題を呼ぶ", { k });
    const result = k * product(k-1);
    observe("積を返す", { k, result });
    return result;
  }
  return product(n);
}

function gcd({ a, b }, observe = () => {}) {
  while (b !== 0) {
    const remainder = a % b;
    observe("余りに置き換える", { a, b, remainder });
    [a,b] = [b,remainder];
  }
  return a;
}

function sieve({ limit }, observe = () => {}) {
  const prime = Array(limit+1).fill(true);
  prime[0] = prime[1] = false;
  for (let p=2; p*p<=limit; p++) {
    if (!prime[p]) continue;
    const removed = [];
    for (let k=p*p; k<=limit; k+=p) {
      if (prime[k]) removed.push(k);
      prime[k] = false;
    }
    observe("素数の倍数を除く", { p, removed });
  }
  const answer = [];
  for (let k=2;k<=limit;k++) if (prime[k]) answer.push(k);
  return answer;
}

function fastPower({ base, exponent }, observe = () => {}) {
  let factor = base, result = 1, n = exponent;
  while (n > 0) {
    if (n % 2 === 1) result *= factor;
    observe("指数の下位ビットを処理", { n, factor, result });
    n = Math.floor(n/2);
    if (n > 0) factor *= factor;
  }
  return result;
}

function subsets({ values }, observe = () => {}) {
  const answer = [], path = [];
  function choose(i) {
    if (i === values.length) {
      answer.push([...path]);
      observe("選び方を記録", { i, path, count: answer.length });
      return;
    }
    choose(i+1);
    path.push(values[i]);
    observe("要素を選ぶ", { i, path });
    choose(i+1);
    path.pop();
  }
  choose(0);
  return answer;
}

function kmpSearch({ text, pattern }, observe = () => {}) {
  const chars = [...text], key = [...pattern];
  if (!key.length) return 0;
  const prefix = Array(key.length).fill(0);
  for (let i=1, j=0; i<key.length; i++) {
    while (j > 0 && key[i] !== key[j]) j = prefix[j-1];
    if (key[i] === key[j]) j++;
    prefix[i] = j;
    observe("接頭辞と接尾辞の一致長", { key, prefix, i }, [i]);
  }
  for (let i=0, j=0; i<chars.length; i++) {
    while (j > 0 && chars[i] !== key[j]) {
      j = prefix[j-1];
      observe("照合位置を戻す", { chars, i, j }, [i]);
    }
    if (chars[i] === key[j]) j++;
    observe("文字を照合", { chars, i, matched: j }, [i]);
    if (j === key.length) return i-j+1;
  }
  return -1;
}

function fibonacci({ n }, observe = () => {}) {
  const table = [0];
  if (n > 0) table.push(1);
  for (let i=2; i<=n; i++) {
    table.push(table[i-1]+table[i-2]);
    observe("直前の2項から計算", { table, i }, [i]);
  }
  return table[n];
}

function coinChange({ coins, amount }, observe = () => {}) {
  const dp = Array(amount+1).fill(Infinity);
  dp[0] = 0;
  for (let total=1; total<=amount; total++) {
    for (const coin of coins) {
      if (coin <= total) dp[total] = Math.min(dp[total], dp[total-coin]+1);
    }
    observe("この金額の最少枚数を確定", { dp, total }, [total]);
  }
  return Number.isFinite(dp[amount]) ? dp[amount] : null;
}

function knapsack({ weights, profits, capacity }, observe = () => {}) {
  const dp = Array(capacity+1).fill(0);
  for (let item=0; item<weights.length; item++) {
    for (let space=capacity; space>=weights[item]; space--) {
      dp[space] = Math.max(dp[space], dp[space-weights[item]] + profits[item]);
      observe("品物を入れるか比較", { dp, item, space }, [space]);
    }
  }
  return dp[capacity];
}

function longestCommonSubsequence({ a, b }, observe = () => {}) {
  const x = [...a], y = [...b];
  const dp = Array.from({length:x.length+1},()=>Array(y.length+1).fill(0));
  for (let i=1; i<=x.length; i++) {
    for (let j=1; j<=y.length; j++) {
      dp[i][j] = x[i-1] === y[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j],dp[i][j-1]);
      observe("共通部分列の長さを更新", { dp, i, j, leftChar:x[i-1], rightChar:y[j-1] });
    }
  }
  return dp[x.length][y.length];
}

function editDistance({ a, b }, observe = () => {}) {
  const x = [...a], y = [...b];
  const dp = Array.from({length:x.length+1},(_,i)=>Array.from({length:y.length+1},(_,j)=>i+j));
  for (let i=1; i<=x.length; i++) {
    for (let j=1; j<=y.length; j++) {
      const replace = dp[i-1][j-1] + Number(x[i-1] !== y[j-1]);
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, replace);
      observe("編集回数の最小値を更新", { dp, i, j, replace });
    }
  }
  return dp[x.length][y.length];
}

function increasingSubsequence({ values }, observe = () => {}) {
  const lengths = Array(values.length).fill(1);
  for (let i=0; i<values.length; i++) {
    for (let j=0; j<i; j++) {
      if (values[j] < values[i]) lengths[i] = Math.max(lengths[i], lengths[j]+1);
    }
    observe("この値で終わる最長の長さ", { values, i, lengths }, [i]);
  }
  return Math.max(0,...lengths);
}

function validate(id, data) {
  function shortString(key,max) {
    requireInput(typeof data[key]==="string" && [...data[key]].length<=max,key+" は"+max+"文字までの文字列です。");
  }
  switch(id){
    case "factorial": return integer(data.n,"n",0,18);
    case "gcd": integer(data.a,"a",0,10000); integer(data.b,"b",0,10000);
      return requireInput(data.a+data.b>0,"a、bの少なくとも一方は正の整数にしてください。");
    case "sieve": return integer(data.limit,"limit",0,100);
    case "power": integer(data.base,"base",-9,9);return integer(data.exponent,"exponent",0,16);
    case "subsets": return integers(data.values,"values",-99,99,6);
    case "kmp": shortString("text",48);return shortString("pattern",16);
    case "fibonacci": return integer(data.n,"n",0,40);
    case "change": integers(data.coins,"coins",1,40,10);return integer(data.amount,"amount",0,40);
    case "knapsack": integers(data.weights,"weights",1,24,10);integers(data.profits,"profits",0,99,10);integer(data.capacity,"capacity",0,24);
      return requireInput(data.weights.length===data.profits.length,"weights と profits の個数を揃えてください。");
    case "lis": return integers(data.values);
    default: shortString("a",12);return shortString("b",12);
  }
}

export const advancedLessons = [
 ["factorial","再帰と階乗","再帰と数理",factorial,{n:5},"n! を n × (n−1)! に分け、0! = 1 に着いたら積を返しながら戻ります。","呼び出す順番と値を返す順番の違いを確かめる。","O(n)","0 は停止条件です。大きな階乗は JavaScript の整数精度を超えるため、この教材は18までです。"],
 ["gcd","ユークリッドの互除法","再帰と数理",gcd,{a:84,b:30},"2数をともに割り切る数は、小さい数と割った余りも割り切ります。余りが0になるまで繰り返します。","画面の縦横比や分数を約分する。","正整数で O(log min(a,b))","片方が0ならもう片方が答えです。両方0はこの教材では扱いません。"],
 ["sieve","エラトステネスの篩","再帰と数理",sieve,{limit:30},"小さい素数から順に倍数に印をつけ、印のない数を素数として残します。","上限以下の素数をまとめて求める。","O(n log log n)","p² より小さい p の倍数には、より小さい素因数があり、すでに印が付きます。"],
 ["power","繰り返し二乗法","再帰と数理",fastPower,{base:3,exponent:5},"指数を半分にしながら底を二乗し、指数が奇数の回だけ答えに掛けます。","少ない乗算回数で整数の累乗を求める。","O(log exponent)","指数0の空積は1と定義します。入力範囲は正確な整数として計算できる大きさです。"],
 ["subsets","バックトラッキング","再帰と数理",subsets,{values:[2,4,7]},"各位置で選ぶ・選ばないの枝をたどり、戻るときに直前の選択を取り消します。","少数の商品から選べるセットをすべて列挙する。","出力を含めて O(n × 2ⁿ)","部分集合は空集合も含みます。位置ごとに選ぶので同じ値が2つあれば結果の値は重複し得ます。"],
 ["kmp","KMP 文字列検索","文字列",kmpSearch,{text:"abababaca",pattern:"ababaca"},"不一致のたびに、すでに一致した接頭辞の情報を使い、本文を巻き戻さずに次の候補へ進みます。","長い本文中で特定の語が初めて現れる位置を探す。","O(n + m)","空パターンは0、不一致は -1。この教材の文字位置は Unicode コードポイント単位です。"],
 ["fibonacci","フィボナッチ数列","動的計画法",fibonacci,{n:8},"小さい番号の答えを表に保存し、同じ部分問題を何度も計算せずに次の項を作ります。","表を埋める順序と漸化式の関係を学ぶ。","O(n)","F(0)=0、F(1)=1。表全体を残すと、各項がどの値からできたか追えます。"],
 ["change","最少コイン枚数","動的計画法",coinChange,{coins:[1,3,4],amount:6},"最後に使うコインを仮定し、残額を作る最少枚数に1を加えた候補から最小を選びます。","任意の額面でお釣りを最少枚数にする。","O(金額 × 額面数)","同じコインを何枚でも使えます。最大額面から取る方法では 6=3+3 を逃すことがあります。"],
 ["knapsack","0/1 ナップサック","動的計画法",knapsack,{weights:[2,3,4],profits:[4,5,7],capacity:6},"各品物を入れる場合と入れない場合の利益を比較し、容量ごとの最大値を残します。","重量制限のある荷物に入れる商品の価値を最大化する。","O(品物数 × 容量)","容量は大きい方から更新します。同じ品物をこの周回で2回使わないためです。"],
 ["lcs","最長共通部分列","動的計画法",longestCommonSubsequence,{a:"ABCBD",b:"BACD"},"先頭から i 文字と j 文字を比べ、一致なら左上+1、不一致なら上と左の大きい方を選びます。","2つの編集履歴に共通して残る順序の長さを調べる。","O(nm)","部分列は飛び飛びでもよく、文字の順序は変えられません。返すのは長さです。"],
 ["edit","編集距離","動的計画法",editDistance,{a:"cat",b:"cut"},"先頭部分を一致させるための挿入・削除・置換を比較し、最少の回数を表に記録します。","入力語と候補語が何回の修正で一致するか測る。","O(nm)","3操作のコストは各1で、同じ文字は0です。文字の入れ替えは1操作に含みません。"],
 ["lis","最長増加部分列","動的計画法",increasingSubsequence,{values:[3,1,4,2,5]},"各位置を末尾に選んだとき、それより前の小さい値で終わる列を1つ伸ばします。","順序を保ったまま値が伸び続ける最長の記録を探す。","この実装は O(n²)","値は厳密に増加します。同じ値を何度選んでも長さは増えません。"]
].map(([id,title,group,solve,example,idea,use,time,note])=>({id,title,group,solve,example,idea,use,time,note,validate:data=>validate(id,data)}));
