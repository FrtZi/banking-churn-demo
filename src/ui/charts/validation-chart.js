import { pct } from "../format.js";
import { THEME } from "../theme.js";
import { line, polyline, rect, text } from "./svg.js";

const BOX = { left: 40, top: 22, width: 345, height: 180 };

/** Scales: depth 1..depths on x; score on y, from 50% (coin flip) down to the lowest score if below. */
function scales(curve, depths) {
  const { left: L, top: T, width: W, height: H } = BOX;
  const lowest = Math.min(0.5, ...curve.flatMap((c) => [c.learned, c.hidden]));
  const yMin = Math.floor(lowest * 10) / 10;
  return {
    yMin,
    X: (d) => L + ((d - 1) / Math.max(1, depths - 1)) * W,
    Y: (v) => T + (1 - (v - yMin) / (1 - yMin)) * H,
  };
}

function axes({ X, Y, yMin }, depths) {
  const { left: L, top: T, width: W, height: H } = BOX;
  let s = "";
  for (let tick = Math.round(yMin * 10); tick <= 10; tick++) {
    const v = tick / 10;
    s += line(L, Y(v), L + W, Y(v), THEME.grid);
    s += text(L - 6, Y(v) + 4, pct(v), { fill: THEME.muted, anchor: "end" });
  }
  for (let d = 1; d <= depths; d++) s += text(X(d), T + H + 15, d, { fill: THEME.muted, anchor: "middle" });
  return (
    s + text(L + W / 2, T + H + 31, "Number of questions (depth)", { fill: THEME.muted, size: 12, anchor: "middle" })
  );
}

/** Background zones once the search is complete: too simple | best | memorizing. */
function zones({ X }, best, depths) {
  const { left: L, top: T, width: W, height: H } = BOX;
  const xb = X(best);
  let s = "";
  if (best > 1) {
    s += rect(L, T, xb - L - 12, H, { fill: THEME.text, opacity: ".04" });
    s += text((L + xb - 12) / 2, T - 7, "Too simple", { fill: THEME.muted, anchor: "middle" });
  }
  s += rect(xb - 12, T, 24, H, { fill: THEME.bestBand, opacity: ".16" });
  if (best < depths) {
    s += rect(xb + 12, T, L + W - xb - 12, H, { fill: THEME.text, opacity: ".04" });
    s += text((xb + 12 + L + W) / 2, T - 7, "Memorizing", { fill: THEME.muted, anchor: "middle" });
  }
  return s;
}

function series({ X, Y }, curve) {
  if (!curve.length) return "";
  let s = "";
  if (curve.length > 1) {
    // the gap between the two lines = overfitting
    const top = curve.map((c) => `${X(c.depth)},${Y(c.learned)}`);
    const bottom = [...curve].reverse().map((c) => `${X(c.depth)},${Y(c.hidden)}`);
    s += `<polygon points="${top.concat(bottom).join(" ")}" fill="${THEME.hidden}" opacity=".10"/>`;
  }
  for (const [key, colour] of [
    ["learned", THEME.learned],
    ["hidden", THEME.hidden],
  ]) {
    s += polyline(
      curve.map((c) => `${X(c.depth)},${Y(c[key])}`),
      colour,
    );
    for (const c of curve) {
      s += `<circle cx="${X(c.depth)}" cy="${Y(c[key])}" r="4.5" fill="${colour}" stroke="${THEME.card}" stroke-width="2"><title>${c.depth} questions: ${pct(c[key])} on ${key} clients</title></circle>`;
    }
  }
  return s;
}

/**
 * Validation curve: score on learned vs hidden clients by depth. `curve` may be partial during the animation;
 * `best` is the best depth, drawn once the search is `done`; `current` is the depth of the slider.
 */
export function drawValidationChart(svg, { curve, best, done, depths, current }) {
  const { top: T, height: H, left: L, width: W } = BOX;
  const scale = scales(curve, depths);
  let s = done ? zones(scale, best, depths) : "";
  s += axes(scale, depths) + series(scale, curve);
  if (done) {
    const top = curve[best - 1];
    const last = curve.at(-1);
    s += text(scale.X(top.depth), scale.Y(top.hidden) + 20, `Best: ${top.depth}`, {
      fill: THEME.text,
      size: 12,
      weight: 700,
      anchor: "middle",
    });
    if (last.learned - last.hidden > 0.08) {
      const y = (scale.Y(last.learned) + scale.Y(last.hidden)) / 2 + 4;
      s += text(scale.X(depths) - 4, y, "overfitting gap", { fill: THEME.text, anchor: "end" });
    }
  }
  s += line(scale.X(current), T, scale.X(current), T + H, THEME.text, 1, { opacity: ".5" });
  if (!curve.length) {
    s += text(L + W / 2, T + H / 2, "Click “Find the best level” to measure", {
      fill: THEME.muted,
      size: 13,
      anchor: "middle",
    });
  }
  svg.innerHTML = s;
}
