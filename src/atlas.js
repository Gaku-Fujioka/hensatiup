import { TERRAIN } from "./maps.js";

const tree = [
  "    aa    ",
  "    ab    ",
  "   aabb   ",
  "   acbb   ",
  "  accabb  ",
  "   accb   ",
  "  acccbb  ",
  " accccabb ",
  "accdccaabb",
  "  eeeeeb  ",
  "    tt    ",
  "    tt    ",
];
const palette = {
  a: "#307858",
  b: "#266549",
  c: "#4a9364",
  d: "#75aa73",
  e: "#3d8056",
  t: "#876c42",
};

function sprite(ctx, pattern, x, y, scale) {
  pattern.forEach((row, j) =>
    [...row].forEach((c, i) => {
      if (c === " ") return;
      ctx.fillStyle = palette[c];
      ctx.fillRect(x + i * scale, y + j * scale, scale, scale);
    }),
  );
}

const grassColors = {
  river: ["#dce8af", "#d6e4a7", "#dae6ac", "#d3e2a4"],
  sand: ["#d9d29d", "#d4ce99", "#ddd5a2", "#d8d09b"],
  pass: ["#c3d7b6", "#bcd0ae", "#c0d5b1", "#bcd2b6"],
};
function tile(ctx, type, x, y, seed, region) {
  const colors = grassColors[region] ?? grassColors.river;
  ctx.fillStyle =
    type === "~"
      ? "#9ccbd0"
      : type === ":"
        ? region === "sand"
          ? "#e9b878"
          : "#eace93"
        : type === "#"
          ? "#b9d396"
          : colors[seed % 4];
  ctx.fillRect(x, y, 40, 40);
  if (type === "#") {
    ctx.fillStyle = "#a1be85";
    ctx.fillRect(x + 4, y + 29, 22, 4);
    sprite(ctx, tree, x + 3, y + 9, 2);
    sprite(ctx, tree, x + 15, y + 1, 2);
    return;
  }
  for (let n = 0; n < 4; n++) {
    const dx = x + 3 + ((seed * 7 + n * 11) % 30);
    const dy = y + 4 + ((seed * 11 + n * 17) % 28);
    if (type === "~") {
      ctx.fillStyle = n % 2 ? "#aad9d7" : "#81b8be";
      ctx.fillRect(dx - 2, dy, 5 + n, 1.6);
      ctx.fillRect(dx + 3 + n, dy - 1.5, 3, 1.6);
    } else if (type === ":") {
      ctx.fillStyle = n % 2 ? "#f7deaa" : "#c5a56b";
      ctx.fillRect(dx, dy, 3, 2);
    } else {
      ctx.fillStyle = n % 2 ? "#bed298" : "#c5d89a";
      ctx.fillRect(dx, dy, 2, 3);
      ctx.fillRect(dx + 2, dy + 2, 2, 2);
      if (seed % 11 === 0 && n < 2) {
        ctx.fillStyle = "#fff3c0";
        ctx.fillRect(dx - 2, dy, 3, 2);
        ctx.fillStyle = "#d3a34d";
        ctx.fillRect(dx, dy, 2, 2);
      }
    }
  }
}

export function coordinates(map, cell) {
  return String.fromCharCode(65 + (cell % map.cols)) + (Math.floor(cell / map.cols) + 1);
}

export function boardLabel(map, cell) {
  return (
    coordinates(map, cell) +
    " " +
    (cell === map.start ? "出発地" : cell === map.goal ? "目的地" : TERRAIN[map.cells[cell]].name)
  );
}

let cache;
function terrainLayer(map) {
  const key = [map.id, map.cols, map.rows, map.cells.join("")].join("/");
  if (cache?.key === key) return cache.canvas;
  const canvas = document.createElement("canvas");
  canvas.width = map.cols * 40;
  canvas.height = map.rows * 40;
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < map.cells.length; i++) {
    const x = (i % map.cols) * 40,
      y = Math.floor(i / map.cols) * 40;
    tile(ctx, map.cells[i], x, y, (i * 97 + (i % map.cols) * 13) % 997, map.id);
    if (map.cells[i] === "~") {
      ctx.fillStyle = "#e3dbb1";
      if (i % map.cols && map.cells[i - 1] !== "~") ctx.fillRect(x, y, 3, 40);
      if (i >= map.cols && map.cells[i - map.cols] !== "~") ctx.fillRect(x, y, 40, 3);
      if (i % map.cols < map.cols - 1 && map.cells[i + 1] !== "~") ctx.fillRect(x + 37, y, 3, 40);
    }
    ctx.strokeStyle = "rgba(84,109,65,.16)";
    ctx.strokeRect(x + 0.5, y + 0.5, 39.5, 39.5);
  }
  cache = { key, canvas };
  return canvas;
}

function trail(ctx, path, center, color, offset, dashed) {
  if (!path?.length) return;
  ctx.save();
  ctx.beginPath();
  path.forEach((cell, i) => {
    const [x, y] = center(cell);
    if (i === 0) ctx.moveTo(x, y + offset);
    else ctx.lineTo(x, y + offset);
  });
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#fff5d7";
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  if (dashed) ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.restore();
}

function vehicle(ctx, x, y, scout) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.fillStyle = "#273a32";
  ctx.fillRect(-10, -5, 20, 10);
  ctx.fillRect(-7, 4, 4, 4);
  ctx.fillRect(4, 4, 4, 4);
  ctx.fillStyle = scout ? "#438bac" : "#e49b36";
  ctx.fillRect(-9, -4, 18, 7);
  ctx.fillRect(0, -8, 7, 5);
  ctx.fillStyle = "#c5e6e5";
  ctx.fillRect(2, -7, 4, 3);
  ctx.fillStyle = scout ? "#9ed6df" : "#ffdfa1";
  ctx.fillRect(-9, -7, 8, 7);
  ctx.fillStyle = "#fff6c4";
  ctx.fillRect(7, -2, 3, 2);
  ctx.restore();
}

// Keep the letter on a separate flag so buildings and both vehicles remain recognisable.
function station(ctx, x, y, label, id) {
  const dispatch = label === "S",
    roof = dispatch ? "#3b7162" : "#b66d43";
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(53,66,43,.23)";
  ctx.fillRect(-16, 9, 33, 6);
  ctx.fillStyle = "#544f39";
  ctx.fillRect(-13, -4, 25, 15);
  ctx.fillStyle = dispatch ? "#e5d3a0" : "#f3dfad";
  ctx.fillRect(-11, -3, 21, 12);
  ctx.fillStyle = roof;
  ctx.fillRect(-15, -7, 29, 5);
  ctx.fillRect(-12, -10, 23, 4);
  ctx.fillRect(-8, -13, 15, 4);
  ctx.fillStyle = "#735c42";
  ctx.fillRect(-8, 2, 5, 8);
  ctx.fillStyle = "#84c1c3";
  ctx.fillRect(1, 0, 6, 4);
  if (!dispatch && id === "river") {
    ctx.fillStyle = "#fff0c8";
    ctx.fillRect(-4, -10, 8, 2);
    ctx.fillRect(-1, -13, 2, 8);
  } else if (!dispatch && id === "pass") {
    ctx.fillStyle = "#58635b";
    ctx.fillRect(9, -17, 2, 13);
    ctx.fillRect(5, -15, 10, 2);
  } else if (!dispatch && id === "sand") {
    ctx.fillStyle = "#547c83";
    ctx.fillRect(-15, 3, 6, 8);
    ctx.fillStyle = "#90babc";
    ctx.fillRect(-15, 2, 6, 2);
  }
  ctx.fillStyle = dispatch ? "#285846" : "#914c2b";
  ctx.fillRect(4, 3, 14, 14);
  ctx.fillStyle = "#fff7db";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 11, 10);
  ctx.restore();
}

export function draw(canvas, map, result, index, cursor, expedition = null) {
  const unit = 40,
    w = map.cols * unit,
    h = map.rows * unit;
  const scale = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  if (canvas.width !== w * scale || canvas.height !== h * scale) {
    canvas.width = w * scale;
    canvas.height = h * scale;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.drawImage(terrainLayer(map), 0, 0);
  const center = (cell) => [((cell % map.cols) + 0.5) * unit, (Math.floor(cell / map.cols) + 0.5) * unit];
  function shade(i, fill) {
    const [x, y] = center(i);
    ctx.fillStyle = fill;
    ctx.fillRect(x - 19, y - 19, 38, 38);
  }
  const frame = result.frames[index];
  result.frames.slice(1, index + 1).forEach((f) => shade(f.current, "rgba(29,140,128,.30)"));
  for (const i of frame.frontier) {
    if (index === 0) continue;
    const [x, y] = center(i);
    ctx.fillStyle = "#407a8a";
    ctx.fillRect(x - 3, y - 3, 6, 6);
  }
  if (frame.current !== null) {
    const [x, y] = center(frame.current);
    ctx.strokeStyle = "#225950";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 15, y - 15, 30, 30);
  }
  if (index === result.frames.length - 1 && result.path.length) {
    ctx.beginPath();
    result.path.forEach((i, n) => (n ? ctx.lineTo(...center(i)) : ctx.moveTo(...center(i))));
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#fff5c8";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#b6721e";
    ctx.stroke();
  }
  if (expedition) {
    trail(ctx, expedition.guide, center, "#367986", -6, true);
    trail(ctx, expedition.path, center, "#b9681e", expedition.guide ? 5 : 0, false);
  }
  for (const [i, label, color] of [
    [map.start, "S", "#246c53"],
    [map.goal, "G", "#b9682c"],
  ]) {
    const [x, y] = center(i);
    if (expedition) {
      station(ctx, x, y, label, map.id);
      continue;
    }
    ctx.fillStyle = "rgba(62,71,41,.18)";
    ctx.fillRect(x - 14, y - 11, 28, 29);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - 15, y - 16, 30, 30, 6);
    ctx.fill();
    ctx.strokeStyle = "#fff7d9";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y);
  }
  if (expedition) {
    if (expedition.head != null && expedition.head !== map.goal) {
      const [x, y] = center(expedition.head);
      vehicle(ctx, x, y + 8, false);
    }
    if (expedition.scout)
      vehicle(ctx, (expedition.scout.x + 0.5) * unit, (expedition.scout.y + 0.5) * unit - 8, true);
    if (expedition.player)
      vehicle(ctx, (expedition.player.x + 0.5) * unit, (expedition.player.y + 0.5) * unit + 8, false);
  }
  if (cursor !== null) {
    const [x, y] = center(cursor);
    ctx.strokeStyle = "#182b39";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(x - 17, y - 17, 34, 34);
    ctx.setLineDash([]);
  }
}
