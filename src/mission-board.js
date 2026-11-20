import { assignments, bestStars } from "./expedition.js";
import { ranks } from "./quest.js";

// Four tiny field patches, drawn on the same pixel grid as the vehicles.
const emblems = {
  river: [
    ".....dddddd.....",
    "....dlllllld....",
    "....dd....dd....",
    "..dddddddddddd..",
    ".dllaaaaaaaalld.",
    ".daaaaaeeaaaaad.",
    ".daaaaaeeaaaaad.",
    ".daaeeeeeeeeaad.",
    ".daaeeeeeeeeaad.",
    ".daaaaaeeaaaaad.",
    ".daaaaaeeaaaaad.",
    ".ddaaaaaaaaaadd.",
    "..dddddddddddd..",
  ],
  sand: [
    "......dddd......",
    ".....dlllld.....",
    ".....dddddd.....",
    "....daaaaald....",
    "...daaaaaaald...",
    "..daaaaaaaaaad..",
    "..daaaaeaaaaad..",
    "..daaaeeeaaaad..",
    "..daaeeeeelaad..",
    "..daaaeeellaad..",
    "..daaaaaallaad..",
    "..ddaaaaaaaadd..",
    "....dddddddd....",
  ],
  pass: [
    "...........dd...",
    "..........dld...",
    ".........dld....",
    "....ddddddd.....",
    "...daaaaaaadd...",
    "...daeeeeeead...",
    "...daellllead...",
    "...daeeeeeead...",
    "...daaaaaaaad...",
    "...daaddddaad...",
    "...daaddddaad...",
    "...daaaaaaaad...",
    "....dddddddd....",
  ],
  daily: [
    ".......dd.......",
    "......dldd......",
    ".....dllald.....",
    ".....dllaald....",
    "....dlllaaald...",
    "...dllllaaalld..",
    "...dlllddaalld..",
    "..dlllddddaalld.",
    ".dllldd..ddaald.",
    ".dlldd....ddald.",
    "dddddd....dddddd",
    "................",
    "................",
  ],
};
const colors = {
  river: ["#703d2b", "#de7352", "#f7a177", "#fff4cc"],
  sand: ["#234e56", "#41939b", "#69b7b5", "#e4f4c8"],
  pass: ["#44395a", "#8b739c", "#b8a1c1", "#d6f1cc"],
  daily: ["#614826", "#d38b42", "#f1bb68", "#fff3b6"],
};

function fieldPatch(id) {
  const canvas = document.createElement("canvas");
  canvas.className = "quest-emblem";
  canvas.width = 16;
  canvas.height = 16;
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  emblems[id].forEach((row, y) => [...row].forEach((pixel, x) => {
    if (pixel === ".") return;
    ctx.fillStyle = colors[id]["dale".indexOf(pixel)];
    ctx.fillRect(x, y + 2, 1, 1);
  }));
  return canvas;
}

export function mountMissionBoard(regions, selectMap) {
  const cards = document.getElementById("questCards");
  for (const region of regions) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "quest-card";
    card.dataset.region = region.id;
    card.innerHTML = '<span class="quest-info"><small></small><strong></strong><span class="quest-rank"></span></span>';
    card.prepend(fieldPatch(region.id));
    card.querySelector("small").textContent = region.name;
    card.querySelector("strong").textContent = assignments[region.id].title;
    card.onclick = () => selectMap(region.id);
    cards.append(card);
  }
}

export function updateMissionBoard(map, day, records, medals) {
  let total = 0;
  let completed = 0;
  for (const card of document.querySelectorAll(".quest-card")) {
    const id = card.dataset.region;
    const key = id === "daily" ? "daily-" + day : id;
    const stars = bestStars(medals, records, key, assignments[id].budget);
    const rank = card.querySelector(".quest-rank");
    card.setAttribute("aria-pressed", String(id === map.id));
    card.setAttribute("aria-label", card.querySelector("small").textContent + "、" + assignments[id].title + "、最高記録 " + ranks[stars]);
    rank.textContent = "★".repeat(stars) + "☆".repeat(3 - stars) + "　" + ranks[stars];
    rank.dataset.stars = stars;
    total += stars;
    if (stars) completed++;
  }
  document.getElementById("questTotal").textContent = (total === 12 ? "全任務制覇！　" : "獲得した星　") + total + " / 12";
  document.getElementById("progress").textContent = completed + " / 4";
}
