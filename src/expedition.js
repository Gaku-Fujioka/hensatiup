import { maps, TERRAIN } from "./maps.js";
import { makeDailyMap } from "./daily-map.js";

export const assignments = {
  daily: {
    title: "本日の補給要請",
    cargo: "野営セット",
    call: "新しい野営地から補給の依頼です。今日の地形を読み、燃料20以内で救援車を届けてください。地図は日付ごとに替わります。",
    budget: 20,
  },
  river: {
    title: "川向こうの診療所へ",
    cargo: "救急キット",
    call: "増水した川の向こうで、診療所が救急キットを待っています。砂道を横切るか、林の外側を回るか。",
    budget: 28,
  },
  sand: {
    title: "砂丘の給水所へ",
    cargo: "飲料水",
    call: "給水所のタンクが空に。砂丘の集落まで水を届けてください。砂地を抜ける道では燃料を多く使います。",
    budget: 22,
  },
  pass: {
    title: "峠の観測小屋へ",
    cargo: "通信機の電池",
    call: "峠の先で観測小屋の電池が切れそうです。森の切れ目を探して、通信機の電池を届けてください。",
    budget: 25,
  },
};

export function mapKey(map) {
  return [map.id, map.cols, map.rows, map.start, map.goal, map.cells.join("")].join("/");
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

export function positionAt(trip, tick, map) {
  const end = trip.path.length - 1;
  let i = 0;
  while (i < end && trip.times[i + 1] <= tick) i++;
  const a = trip.path[i],
    b = trip.path[Math.min(i + 1, end)];
  const part = i === end ? 0 : Math.max(0, (tick - trip.times[i]) / (trip.times[i + 1] - trip.times[i]));
  return {
    x: (a % map.cols) + ((b % map.cols) - (a % map.cols)) * part,
    y: Math.floor(a / map.cols) + (Math.floor(b / map.cols) - Math.floor(a / map.cols)) * part,
  };
}

const key = "routelab.rescue.records.v1";
export function loadRecords(storage) {
  try {
    const data = JSON.parse(storage.getItem(key)) || {};
    return Object.fromEntries(
      Object.entries(data).filter(
        ([id, n]) =>
          (["river", "sand", "pass"].includes(id) || /^daily-\d{4}-\d{2}-\d{2}$/.test(id)) &&
          Number.isSafeInteger(n) &&
          n > 0,
      ),
    );
  } catch {
    return {};
  }
}

export function fileDelivery(records, map, fuel, storage) {
  if (!isOfficial(map)) return records;
  const saved = loadRecords(storage);
  const next = { ...records };
  for (const [id, cost] of Object.entries(saved)) next[id] = Math.min(next[id] ?? Infinity, cost);
  const id = recordKey(map);
  next[id] = Math.min(next[id] ?? Infinity, fuel);
  if (map.id === "daily")
    for (const k of Object.keys(next)) if (k.startsWith("daily-") && k < id) delete next[k];
  try {
    storage.setItem(key, JSON.stringify(next));
  } catch {
    /* Records still apply to this session. */
  }
  return next;
}
