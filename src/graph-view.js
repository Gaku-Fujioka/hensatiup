// Numbers originate in the validated lesson input. All labels are SVG text nodes.
const ns = "http://www.w3.org/2000/svg";
function shape(tag, attrs, label) {
  const node = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (label !== undefined) node.textContent = label;
  return node;
}
export function graphView(id, input, state) {
  if (!["bfs", "dfs", "dijkstra", "topological", "kruskal", "union", "inorder", "astar"].includes(id))
    return null;
  const svg = shape("svg", { viewBox: "0 0 320 170", role: "img", "aria-label": "入力の構造と注目位置" });
  svg.style.cssText = "width:100%;max-height:190px;background:#f9fbf4;border-radius:6px";
  if (id === "astar") {
    const unit = Math.min(26, 150 / input.grid.length, 300 / input.grid[0].length);
    input.grid.forEach((row, y) =>
      [...row].forEach((v, x) => {
        const i = y * row.length + x,
          left = (320 - unit * row.length) / 2 + x * unit,
          top = 8 + y * unit;
        svg.append(
          shape("rect", {
            x: left,
            y: top,
            width: unit - 1,
            height: unit - 1,
            fill:
              v === "#"
                ? "#435d4c"
                : i === state.node
                  ? "#e7ba6b"
                  : state.open?.includes(i)
                    ? "#b7d3c1"
                    : "#e1ebcf",
          }),
        );
        svg.append(
          shape(
            "text",
            {
              x: left + unit / 2,
              y: top + unit * 0.67,
              "text-anchor": "middle",
              fill: v === "#" ? "white" : "#274534",
              "font-size": 10,
            },
            i === input.start ? "S" : i === input.goal ? "G" : i,
          ),
        );
      }),
    );
    return svg;
  }
  let positions, edges, labels;
  if (id === "inorder") {
    labels = input.tree;
    positions = labels.map((_, i) => {
      const level = Math.floor(Math.log2(i + 1));
      return [((i + 1 - 2 ** level + 0.5) * 320) / 2 ** level, 18 + level * 33];
    });
    edges = labels.flatMap((v, i) => (i && v !== null ? [[Math.floor((i - 1) / 2), i]] : []));
  } else {
    labels = Array.from({ length: input.n }, (_, i) => i);
    edges = input.edges;
    positions = labels.map((_, i) => {
      const angle = (i / input.n) * 2 * Math.PI - Math.PI / 2;
      return [160 + 120 * Math.cos(angle), 85 + 63 * Math.sin(angle)];
    });
  }
  const directed = ["bfs", "dfs", "dijkstra", "topological"].includes(id);
  const defs = shape("defs", {}),
    marker = shape("marker", {
      id: "edgeTip",
      viewBox: "0 0 10 10",
      refX: 8,
      refY: 5,
      markerWidth: 5,
      markerHeight: 5,
      orient: "auto",
    });
  marker.append(shape("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#678476" }));
  defs.append(marker);
  svg.append(defs);
  for (const [a, b, w] of edges) {
    const [x, y] = positions[a],
      [u, v] = positions[b],
      dx = u - x,
      dy = v - y,
      len = Math.hypot(dx, dy) || 1;
    const stroke = state.from === a && state.to === b ? "#b7802a" : "#84998c";
    const attrs = { stroke, "stroke-width": 1.6, fill: "none" };
    if (directed) attrs["marker-end"] = "url(#edgeTip)";
    const d =
      a === b
        ? `M ${x - 8} ${y - 7} c -18 -22 30 -22 16 0`
        : `M ${x + (dx / len) * 12} ${y + (dy / len) * 12} L ${u - (dx / len) * 13} ${v - (dy / len) * 13}`;
    svg.append(shape("path", { ...attrs, d }));
    if (w !== undefined)
      svg.append(
        shape(
          "text",
          {
            x: (x + u) / 2 + 3,
            y: (y + v) / 2 - 3,
            fill: "#395743",
            "font-size": 12,
            stroke: "#f9fbf4",
            "stroke-width": 3,
            "paint-order": "stroke",
          },
          w,
        ),
      );
  }
  positions.forEach(([x, y], i) => {
    if (labels[i] === null) return;
    const active = [state.node, state.index, state.from, state.to].includes(i);
    svg.append(
      shape("circle", { cx: x, cy: y, r: 11, fill: active ? "#e7ba6b" : "#e0ecdd", stroke: "#547360" }),
      shape("text", { x, y: y + 4, "text-anchor": "middle", "font-size": 11, fill: "#20392d" }, labels[i]),
    );
  });
  return svg;
}
