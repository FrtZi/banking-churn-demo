import { edgeLabel, shortName } from "../../engine/index.js";
import { pct } from "../format.js";
import { inkOn, riskColour, THEME } from "../theme.js";
import { rect, text } from "./svg.js";

const NODE = { width: 176, height: 64, gapX: 16, gapY: 64 };

/** Leaves side by side, each parent centred above its children; returns the drawing size. */
function layout(root) {
  let nextLeafX = 0;
  let maxDepth = 0;
  const place = (node, depth) => {
    maxDepth = Math.max(maxDepth, depth);
    if (!node.f) {
      node.x = nextLeafX;
      nextLeafX += NODE.width + NODE.gapX;
    } else {
      place(node.yes, depth + 1);
      place(node.no, depth + 1);
      node.x = (node.yes.x + node.no.x) / 2;
    }
    node.y = depth * (NODE.height + NODE.gapY);
  };
  place(root, 0);
  return { width: nextLeafX - NODE.gapX, height: (maxDepth + 1) * (NODE.height + NODE.gapY) - NODE.gapY };
}

function edge(parent, child, yes) {
  const { width: W, height: H, gapY } = NODE;
  const [x1, y1, x2, y2] = [parent.x + W / 2, parent.y + H, child.x + W / 2, child.y];
  const label = edgeLabel(parent.f, parent.t, yes);
  const [lx, ly] = [(x1 + x2) / 2, (y1 + y2) / 2 + 4];
  return (
    `<path d="M${x1},${y1} C${x1},${y1 + gapY / 2} ${x2},${y2 - gapY / 2} ${x2},${y2}" fill="none" stroke="${THEME.edge}" stroke-width="2"/>` +
    rect(lx - label.length * 3.6 - 6, ly - 14, label.length * 7.2 + 12, 20, {
      rx: 10,
      fill: THEME.page,
      stroke: THEME.edgeLabel.stroke,
    }) +
    text(lx, ly, label, { fill: THEME.edgeLabel.text, size: 12, anchor: "middle" })
  );
}

function nodeBox(n) {
  const { width: W, height: H } = NODE;
  const ink = inkOn(n.p);
  const cx = n.x + W / 2;
  const box = rect(n.x, n.y, W, H, {
    rx: 10,
    fill: riskColour(n.p),
    stroke: n.f ? "none" : THEME.page,
    "stroke-width": n.f ? 0 : 2,
  });
  const lines = n.f
    ? text(cx, n.y + 26, shortName(n.f), { fill: ink, size: 15, weight: 700, anchor: "middle" }) +
      text(cx, n.y + 48, `${n.n} clients · ${pct(n.p)} left`, { fill: ink, size: 12.5, anchor: "middle" })
    : text(cx, n.y + 30, `${pct(n.p)} left`, { fill: ink, size: 22, weight: 700, anchor: "middle" }) +
      text(cx, n.y + 51, `${n.n} clients`, { fill: ink, size: 12.5, anchor: "middle" });
  return `<g><title>${n.n} clients, ${n.pos} left (${pct(n.p)})</title>${box}${lines}</g>`;
}

/** Draws a decision tree: node colour = share of leavers, edge label = the answer that leads there. */
export function drawTreeChart(svg, tree) {
  const { width, height } = layout(tree);
  svg.setAttribute("viewBox", `-10 -10 ${width + 20} ${height + 20}`);
  let s = "";
  const walk = (n) => {
    if (n.f) {
      for (const [child, yes] of [
        [n.yes, true],
        [n.no, false],
      ]) {
        s += edge(n, child, yes);
        walk(child);
      }
    }
    s += nodeBox(n);
  };
  walk(tree);
  svg.innerHTML = s;
}
