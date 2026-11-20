import { coordinates } from "./atlas.js";
import { assignments } from "./expedition.js";

export const ranks = ["未踏", "銅章", "銀章", "金章"];

// The two fixed relay sites are visited from the foot of the pass toward its summit.
// On daily terrain a marker on a minimum-cost path keeps the full contract achievable.
export function missionMarkers(map, optimalPath) {
  if (map.id === "river") return [7 * map.cols + 5];
  if (map.id === "pass") return [6 * map.cols + 6, 2 * map.cols + 8];
  if (map.id === "daily") return [optimalPath[Math.floor(optimalPath.length / 2)]];
  return [];
}

export function markersReached(markers, path) {
  let reached = 0;
  for (const cell of path) if (cell === markers[reached]) reached++;
  return reached;
}

export function missionObjectives(map, trip, markers) {
  const { cargo, budget } = assignments[map.id];
  const arrived = trip.path.at(-1) === map.goal;
  const reached = markersReached(markers, trip.path);
  const locations = markers.map((cell) => coordinates(map, cell));
  let label, detail, met;
  switch (map.id) {
    case "sand": {
      const sand = trip.path.slice(1).filter((cell) => map.cells[cell] === ":").length;
      label = "砂地に入らずに届ける";
      detail = "通過した砂地 " + sand + "マス";
      met = arrived && sand === 0;
      break;
    }
    case "pass":
      label = locations.join(" → ") + " の順に中継器を起動";
      detail = "起動 " + reached + " / 2";
      met = reached === 2;
      break;
    default:
      label = locations[0] + (map.id === "river" ? " で薬箱を回収" : " で野営旗を確認");
      detail = reached ? "経由済み" : "紫の旗が目印";
      met = reached === 1;
  }
  return [
    { label: cargo + "をGへ届ける", detail: arrived ? "Gまで接続" : "SからGへ", met: arrived },
    { label: "燃料" + budget + "以内で到着", detail: "燃料 " + trip.fuel + " / " + budget, met: arrived && trip.fuel <= budget },
    { label, detail, met },
  ];
}
