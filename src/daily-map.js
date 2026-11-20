// Local calendar day; all devices opening the same date see the same board.
export function calendarDay(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function makeDailyMap(day = calendarDay()) {
  let seed = 2166136261;
  for (const ch of day) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
  function random(max) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor((seed / 4294967296) * max);
  }
  const cols = 15,
    rows = 9;
  const cells = Array.from({ length: cols * rows }, () => {
    const r = random(100);
    if (r < 17) return "#";
    if (r < 26) return "~";
    if (r < 42) return ":";
    return ".";
  });
  const y = 2 + random(5),
    detour = y + (y < 4 ? 1 : y > 4 ? -1 : random(2) ? 1 : -1) * (2 + random(2));
  const x1 = 1 + random(2),
    x2 = 12 + random(2);
  const index = (x, row) => row * cols + x;
  // Reserve a costly straight road and a longer low-cost corridor before placing the endpoints.
  for (let x = 1; x <= 13; x++) cells[index(x, y)] = x >= 4 && x <= 10 ? ":" : ".";
  for (let x = x1; x <= x2; x++) cells[index(x, detour)] = ".";
  for (let row = Math.min(y, detour); row <= Math.max(y, detour); row++) {
    cells[index(x1, row)] = ".";
    cells[index(x2, row)] = ".";
  }
  return {
    id: "daily",
    day,
    name: "日替わり遠征",
    cols,
    rows,
    cells,
    start: index(1, y),
    goal: index(13, y),
  };
}
