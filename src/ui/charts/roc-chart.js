import { calls } from "../state.js";
import { pct, thresholdPct } from "../format.js";
import { THEME } from "../theme.js";
import { line, polyline, text } from "./svg.js";

const BOX = { left: 52, top: 12, width: 330, height: 250 }; // plot box inside the 400 × 330 viewBox
const X = (v) => BOX.left + v * BOX.width;
const Y = (v) => BOX.top + (1 - v) * BOX.height;
const LABEL = { size: 12, weight: 700, events: "none" }; // bold labels of the chart, not clickable

function axes() {
  const { left: L, top: T, width: W, height: H } = BOX;
  let s = "";
  for (const v of [0, 0.25, 0.5, 0.75, 1]) {
    s += line(X(v), T, X(v), T + H, THEME.grid) + line(L, Y(v), L + W, Y(v), THEME.grid);
    s += text(X(v), T + H + 16, pct(v), { fill: THEME.muted, anchor: "middle" });
    s += text(L - 6, Y(v) + 4, pct(v), { fill: THEME.muted, anchor: "end" });
  }
  s += text(L + W / 2, T + H + 34, "False alarms: share of loyal clients called (1 − specificity)", {
    fill: THEME.muted,
    size: 12,
    anchor: "middle",
  });
  s += text(0, 0, "Leavers caught (sensitivity)", {
    fill: THEME.muted,
    size: 12,
    anchor: "middle",
    transform: `translate(14 ${T + H / 2}) rotate(-90)`,
  });
  // coin-flip diagonal, its label follows the slope of the plot box
  const angle = -(Math.atan2(H, W) * 180) / Math.PI;
  s += line(X(0), Y(0), X(1), Y(1), THEME.edge);
  return (
    s + text(X(0.7), Y(0.66), "coin flip", { fill: THEME.muted, transform: `rotate(${angle} ${X(0.7)} ${Y(0.66)})` })
  );
}

function dot(point, i, isCurrent) {
  const tip =
    point.t === Infinity
      ? "Call nobody"
      : `Threshold ${thresholdPct(point.t)}%: ${calls(point)} calls, ${pct(point.tpr)} of leavers caught, ${pct(point.fpr)} of loyal clients called`;
  const [cx, cy] = [X(point.fpr), Y(point.tpr)];
  return (
    `<circle class="hit" data-i="${i}" cx="${cx}" cy="${cy}" r="12" fill="transparent" tabindex="0" role="button" aria-label="${tip}"><title>${tip}</title></circle>` +
    `<circle class="dot" cx="${cx}" cy="${cy}" r="${isCurrent ? 7 : 4.5}" fill="${isCurrent ? THEME.text : THEME.curve}" stroke="${THEME.card}" stroke-width="2" pointer-events="none"/>`
  );
}

/** Elbow label below-right (clear of the y-axis ticks), best-€ label up-left (clear of the curve). */
function markers(elbow, best) {
  if (!elbow) return "";
  const label = (point, content, below) =>
    below
      ? text(X(point.fpr) + 8, Y(point.tpr) + 24, content, { ...LABEL, fill: THEME.text })
      : text(X(point.fpr) - 10, Y(point.tpr) - 10, content, { ...LABEL, fill: THEME.text, anchor: "end" });
  return elbow === best
    ? label(elbow, "Elbow = best €", true)
    : label(elbow, "Elbow", true) + label(best, "Best €", false);
}

/** The room's rules as one point (a diamond) on the ROC plane. */
function roomPoint(m) {
  const pos = m.tp + m.fn;
  const neg = m.fp + m.tn;
  const [rx, ry] = [X(neg ? m.fp / neg : 0), Y(pos ? m.tp / pos : 0)];
  const tip = `Room's rules: ${calls(m)} calls, ${m.tp} of ${pos} leavers caught, ${m.fp} false alarms`;
  return (
    `<rect x="${rx - 6}" y="${ry - 6}" width="12" height="12" transform="rotate(45 ${rx} ${ry})" fill="${THEME.room}" stroke="${THEME.card}" stroke-width="2"><title>${tip}</title></rect>` +
    text(rx + 11, ry + 4, "Room", { ...LABEL, fill: THEME.text })
  );
}

/**
 * ROC curve with one clickable dot per threshold. `onPick(point)` is called when a dot is clicked or
 * activated with Enter / Space.
 */
export function drawRocChart(svg, { points, current, elbow, best, room }, onPick) {
  let s = axes();
  s += polyline(
    points.map((point) => `${X(point.fpr)},${Y(point.tpr)}`),
    THEME.curve,
  );
  points.forEach((point, i) => (s += dot(point, i, point === current)));
  s += markers(elbow, best);
  if (room) s += roomPoint(room);
  svg.innerHTML = s;
  svg.querySelectorAll(".hit").forEach((hit) => {
    const pick = () => onPick(points[+hit.dataset.i]);
    hit.onclick = pick;
    hit.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pick();
      }
    };
  });
}
