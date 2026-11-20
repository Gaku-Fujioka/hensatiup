import { integers, integer, requireInput } from "./trace.js";

function linearSearch({ values, target }, observe = () => {}) {
  for (let i = 0; i < values.length; i++) {
    observe("先頭から照合", { values, i, target }, [i]);
    if (values[i] === target) return i;
  }
  return -1;
}

function binarySearch({ values, target }, observe = () => {}) {
  let left = 0, right = values.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    observe("中央の値と照合", { values, left, mid, right, target }, [mid]);
    if (values[mid] === target) return mid;
    if (values[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

function prefixSum({ values, left, right }, observe = () => {}) {
  const prefix = [0];
  for (const value of values) {
    prefix.push(prefix.at(-1) + value);
    observe("累積値を追加", { values, prefix, value });
  }
  observe("両端の差をとる", { prefix, left, right }, [left, right]);
  return prefix[right] - prefix[left];
}

function twoPointers({ values, target }, observe = () => {}) {
  let left = 0, right = values.length - 1;
  while (left < right) {
    const sum = values[left] + values[right];
    observe("両端の和を調べる", { values, left, right, sum, target }, [left, right]);
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [];
}

function slidingWindow({ values, width }, observe = () => {}) {
  let sum = 0, best = -Infinity;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= width) sum -= values[i - width];
    if (i >= width - 1) best = Math.max(best, sum);
    observe("窓の合計を更新", { values, i, sum, best: i < width - 1 ? null : best }, [i]);
  }
  return best;
}

export function bubbleSort({ values }, observe = () => {}) {
  for (let end = values.length - 1; end > 0; end--) {
    let changed = false;
    for (let i = 0; i < end; i++) {
      observe("比較：隣り合う値", { values, end, i }, [i, i + 1]);
      if (values[i] > values[i + 1]) {
        [values[i], values[i + 1]] = [values[i + 1], values[i]];
        changed = true;
        observe("隣同士を交換", { values, end }, [i, i + 1]);
      }
    }
    if (!changed) break;
  }
  return values;
}

function selectionSort({ values }, observe = () => {}) {
  for (let start = 0; start < values.length; start++) {
    let min = start;
    for (let i = start + 1; i < values.length; i++) {
      observe("比較：最小候補", { values, start, min, i }, [min, i]);
      if (values[i] < values[min]) min = i;
    }
    [values[start], values[min]] = [values[min], values[start]];
    observe("最小値の位置が確定", { values, start }, [start]);
  }
  return values;
}

function insertionSort({ values }, observe = () => {}) {
  for (let i = 1; i < values.length; i++) {
    const key = values[i];
    let j = i;
    while (j > 0) {
      observe("比較：挿入位置", { values, j, key }, [j - 1]);
      if (values[j - 1] <= key) break;
      values[j] = values[j - 1];
      j--;
    }
    values[j] = key;
    observe("空いた位置に挿入", { values, key, j }, [j]);
  }
  return values;
}

function mergeSort({ values }, observe = () => {}) {
  function sort(part) {
    if (part.length <= 1) return part;
    const mid = Math.floor(part.length / 2);
    const left = sort(part.slice(0, mid)), right = sort(part.slice(mid));
    const merged = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
      observe("比較：左右の先頭", { left, right, i, j, merged });
      merged.push(left[i] <= right[j] ? left[i++] : right[j++]);
    }
    return merged.concat(left.slice(i), right.slice(j));
  }
  return sort(values);
}

function quickSort({ values }, observe = () => {}) {
  function sort(part) {
    if (part.length < 2) return part;
    const pivot = part[0], lower = [], equal = [pivot], higher = [];
    for (let i = 1; i < part.length; i++) {
      const value = part[i];
      observe("比較：基準より小さいか", { part, pivot, value, lower, equal, higher }, [i]);
      if (value < pivot) lower.push(value);
      else {
        observe("比較：基準と等しいか", { part, pivot, value }, [i]);
        if (value === pivot) equal.push(value);
        else higher.push(value);
      }
    }
    return [...sort(lower), ...equal, ...sort(higher)];
  }
  return sort(values);
}

function heapSort({ values }, observe = () => {}) {
  function siftDown(root, size) {
    while (root * 2 + 1 < size) {
      let child = root * 2 + 1;
      if (child + 1 < size) {
        observe("比較：左右の子", { values, root, child, size }, [child, child + 1]);
        if (values[child] < values[child + 1]) child++;
      }
      observe("比較：親と子", { values, root, child, size }, [root, child]);
      if (values[root] >= values[child]) break;
      [values[root], values[child]] = [values[child], values[root]];
      root = child;
    }
  }
  for (let i = Math.floor(values.length / 2) - 1; i >= 0; i--) siftDown(i, values.length);
  for (let end = values.length - 1; end > 0; end--) {
    [values[0], values[end]] = [values[end], values[0]];
    observe("最大値を末尾に確定", { values, end }, [end]);
    siftDown(0, end);
  }
  return values;
}

const sample = [7, 2, 5, 2, 9, 1];
const ascending = [1, 3, 4, 7, 11, 16];
const sorts = [
  ["bubble","バブルソート",bubbleSort,"隣同士を比べ、大きい値を右に送ります。1巡すると末尾の1個が確定します。","整列済みかどうかを、交換が起きたかで確かめる。","最悪 O(n²)・整列済み O(n)","等しい値は交換しないので、もとの順序が保たれます。"],
  ["selection","選択ソート",selectionSort,"未整列の範囲から最小値を探し、その範囲の先頭に置きます。","書き込み回数を抑えて順序を整えたいとき。","O(n²)","入力が整列済みでも、最小値を探す比較回数は変わりません。"],
  ["insertion","挿入ソート",insertionSort,"左側を整列済みに保ち、次の値より大きな要素を右にずらして挿入します。","トランプの手札や、ほぼ整列済みの記録を並べる。","最悪 O(n²)・整列済み O(n)","値を上書きする前に、挿入する値を key に退避します。"],
  ["merge","マージソート",mergeSort,"半分ずつに分けて並べ、整列済みの左右の先頭を比較して合流させます。","同点の順序を保ったまま名簿を安定してソートする。","O(n log n)","左右が同じ値なら左を採用します。結合には別の配列が必要です。"],
  ["quick","クイックソート",quickSort,"基準値より小・同・大の3組に分け、小と大だけを再帰的に並べます。","分割のバランスが実行量にどう響くか調べる。","平均 O(n log n)・最悪 O(n²)","この実装の基準は先頭です。並び済みの異なる値を入れると分割が片寄ります。"],
  ["heap","ヒープソート",heapSort,"親が子以上になるように配列を木として整え、最大値を末尾へ順に取り出します。","追加配列を使わずに最悪時の計算量も抑えて並べる。","O(n log n)","左の子は 2i+1、右の子は 2i+2。確定済みの末尾はヒープから除きます。"]
];
const arrays = [
  ["linear","線形探索",linearSearch,{values:sample,target:5},"先頭から1つずつ対象と照合し、最初に一致した位置を返します。","順番の決まっていない名簿から番号を探す。","O(n)","位置は0始まりです。見つからないときは -1 を返します。"],
  ["binary","二分探索",binarySearch,{values:ascending,target:11},"昇順の列の中央と比較し、答えがあり得ない半分を候補から外します。","番号順の名簿から目的の番号を探す。","O(log n)","入力は昇順です。重複がある場合は、一致する位置のどれかを返します。"],
  ["prefix","累積和",prefixSum,{values:sample,left:1,right:4},"位置ごとの合計を前計算し、区間の和を累積値の差で求めます。","日々の売上から任意の期間の売上を求める。","前処理 O(n)・各問 O(1)","左端を含み右端を含まない区間です。左右が同じなら和は0です。"],
  ["pointers","二つのポインタ",twoPointers,{values:ascending,target:14},"昇順の両端を足し、小さすぎれば左、大きすぎれば右を内側に動かします。","合計が予算ぴったりになる2商品を見つける。","O(n)","別々の位置を選びます。組が存在しなければ空配列を返します。"],
  ["window","スライディングウィンドウ",slidingWindow,{values:sample,width:3},"一定幅の区間を1つずらすたび、入る値を足し、出る値を引きます。","連続する3日間で最も売れた期間の合計を出す。","O(n)","負の数だけの列でも動きます。窓が完成するまで最大値を更新しません。"]
];

export const arrayLessons = [
  ...arrays.map(([id,title,solve,example,idea,use,time,note])=>({id,title,solve,example,idea,use,time,note,group:"配列と探索",
    validate(input) {
      integers(input.values);
      if (["binary","pointers"].includes(id)) requireInput(input.values.every((v,i,a)=>!i||a[i-1]<=v),"values を昇順に並べてください。");
      if (["linear","binary","pointers"].includes(id)) integer(input.target,"target",-200,200);
      if (id==="window") integer(input.width,"width",1,input.values.length);
      if (id==="prefix") {integer(input.left,"left",0,input.values.length);integer(input.right,"right",input.left,input.values.length);}
    }
  })),
  ...sorts.map(([id,title,solve,idea,use,time,note])=>({id,title,solve,idea,use,time,note,group:"ソート",example:{values:sample},validate:({values})=>integers(values)}))
];
