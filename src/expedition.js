import { maps, TERRAIN } from "./maps.js";
import { makeDailyMap } from "./daily-map.js";

export const assignments = {
  daily: {
    title: "消えた野営地",
    cargo: "野営セット",
    sender: "先遣隊の偵察員",
    call: "昨夜の雨で道しるべが流された。紫の旗を確認して、野営セットを届けてほしい！",
    hint: "旗は今日の地形に合わせて立っています。旗までと、旗から先の二つに分けて道を考えてみよう。",
    reply: "旗が見えた！ 今夜は全員、屋根の下で眠れるよ。",
    medal: "荒野の開拓者",
    budget: 20,
  },
  river: {
    title: "激流の救命線",
    cargo: "救急キット",
    sender: "川辺の診療所",
    call: "こちら診療所。川があふれた！ 救急キットを頼む。流された予備の薬箱も南の岸に見えている！",
    hint: "橋への近道には砂が積もっています。南岸の薬箱を拾う道と直行する道、どちらが燃料を節約できるかな。",
    reply: "救急キット、受け取ったよ。これで手当てを続けられる！",
    medal: "川の守り手",
    budget: 28,
  },
  sand: {
    title: "砂海のオアシス",
    cargo: "飲料水",
    sender: "砂丘の給水班",
    call: "貯水槽は残りひとしずく。水を満載して来てくれ！ 車輪が沈まないよう、固い地面を選べるか？",
    hint: "砂地を横切ると1歩で燃料4。砂丘の端をたどって、平地がつながる切れ目を探そう。",
    reply: "水だ！ みんな、水筒を持って集まってくれ！",
    medal: "砂海の水先人",
    budget: 22,
  },
  pass: {
    title: "星明かりの中継塔",
    cargo: "通信機の電池",
    sender: "峠の通信士",
    call: "……聞こえるか？ 小屋の電池が切れそうだ。ふもとの第1塔から順に中継器を起こしてくれ！",
    hint: "第1塔を通ってから第2塔へ向かうと通信がつながります。尾根へ上がる前に、ふもとの道を確かめよう。",
    reply: "こちら観測小屋、電源復旧！ 星空の観測データを送るよ。",
    medal: "星をつなぐ者",
    budget: 25,
  },
};

export function mapKey(map) {
  return [recordKey(map), map.cols, map.rows, map.start, map.goal, map.cells.join("")].join("/");
}
export function isOfficial(map) {
  if (map.id === "daily") return mapKey(map) === mapKey(makeDailyMap(map.day));
  return maps.some((original) => mapKey(original) === mapKey(map));
}
export function recordKey(map) {
  return map.id === "daily" ? "daily-" + map.day : map.id;
}

// A straight tap expands to legal adjacent moves; a blocked segment is never partly committed.
export function extendRoute(map, route, cell) {
  const from = route.at(-1);
  if (!Number.isInteger(cell) || cell < 0 || cell >= map.cells.length)
    return { route, notice: "地図の中を選んでください。" };
  const old = route.indexOf(cell);
  if (old >= 0) return { route: route.slice(0, old + 1), notice: "" };
  if (from === map.goal)
    return { route, notice: "到着地点まで引けました。出動するか、道を戻して引き直せます。" };
  const horizontal = Math.floor(from / map.cols) === Math.floor(cell / map.cols);
  if (!horizontal && from % map.cols !== cell % map.cols)
    return { route, notice: "曲がり角を先に選んでください。道は縦か横に伸ばせます。" };
  const stride = Math.sign(cell - from) * (horizontal ? 1 : map.cols);
  const path = [...route];
  for (let next = from + stride; ; next += stride) {
    if (!Number.isFinite(TERRAIN[map.cells[next]].cost))
      return { route, notice: "森と水辺は通れません。手前で曲がってみましょう。" };
    const previous = path.indexOf(next);
    if (previous >= 0) path.length = previous + 1;
    else path.push(next);
    if (next === cell || next === map.goal) break;
  }
  return { route: path, notice: "" };
}

export function itinerary(map, path) {
  let fuel = 0;
  const times = path.map((cell, i) => {
    if (i) fuel += TERRAIN[map.cells[cell]].cost;
    return fuel;
  });
  return { path: [...path], times, fuel, steps: path.length - 1 };
}

export function lastStop(trip, tick) {
  let i = 0;
  while (i + 1 < trip.times.length && trip.times[i + 1] <= tick) i++;
  return i;
}

export function positionAt(trip, tick, map) {
  const end = trip.path.length - 1;
  const i = lastStop(trip, tick);
  const a = trip.path[i],
    b = trip.path[Math.min(i + 1, end)];
  const part = i === end ? 0 : Math.max(0, (tick - trip.times[i]) / (trip.times[i + 1] - trip.times[i]));
  return {
    x: (a % map.cols) + ((b % map.cols) - (a % map.cols)) * part,
    y: Math.floor(a / map.cols) + (Math.floor(b / map.cols) - Math.floor(a / map.cols)) * part,
  };
}

const fuelKey = "routelab.rescue.records.v1";
const medalKey = "routelab.rescue.medals.v1";
function loadBests(storage, key) {
  try {
    const data = JSON.parse(storage.getItem(key)) || {};
    return Object.fromEntries(
      Object.entries(data).filter(
        ([id, n]) =>
          (["river", "sand", "pass"].includes(id) || /^daily-\d{4}-\d{2}-\d{2}$/.test(id)) &&
          Number.isSafeInteger(n) &&
          n > 0 && (key !== medalKey || n <= 3),
      ),
    );
  } catch {
    return {};
  }
}

export const loadRecords = (storage) => loadBests(storage, fuelKey);
export const loadMedals = (storage) => loadBests(storage, medalKey);

function fileBest(records, map, value, storage, key, best) {
  if (!isOfficial(map)) return records;
  const next = loadBests(storage, key);
  for (const [id, n] of Object.entries(records)) next[id] = best(next[id] ?? n, n);
  const id = recordKey(map);
  next[id] = best(next[id] ?? value, value);
  const latest = Object.keys(next).filter((k) => k.startsWith("daily-")).sort().at(-1);
  for (const k of Object.keys(next)) if (k.startsWith("daily-") && k !== latest) delete next[k];
  try {
    storage.setItem(key, JSON.stringify(next));
  } catch {
    /* Records still apply to this session. */
  }
  return next;
}

export const fileDelivery = (records, map, fuel, storage) =>
  fileBest(records, map, fuel, storage, fuelKey, Math.min);
export const fileMedal = (medals, map, stars, storage) =>
  fileBest(medals, map, stars, storage, medalKey, Math.max);

// Previous versions recorded only fuel, which proves delivery and possibly the fuel target.
export function bestStars(medals, records, key, budget) {
  const fuel = records[key];
  return Math.max(medals[key] ?? 0, fuel == null ? 0 : fuel <= budget ? 2 : 1);
}
