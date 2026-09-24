import { auc, evaluateRules, roc } from "../../../engine/index.js";
import { drawRocChart } from "../../charts/roc-chart.js";
import { CONFIG } from "../../config.js";
import { $ } from "../../dom.js";
import { pct, thresholdPct } from "../../format.js";
import { term } from "../../glossary/links.js";
import { hasRules, roomRules } from "../../room-model.js";
import { netValue, state } from "../../state.js";

/** The point with the highest value, or null when there is none. */
const best = (points, value) => (points.length ? points.reduce((b, p) => (value(p) > value(b) ? p : b)) : null);

/**
 * Step 5: ROC curve with the current threshold, the elbow (best statistical balance) and the best-€ point.
 * `onPick(t)` sets a new threshold (dot clicked, or one of the two buttons).
 */
export function drawRoc(onPick) {
  const all = roc(state.tree, state.test);
  // thresholds the slider can reach, plus "call nobody"
  const points = all.filter((point) => point.t === Infinity || point.t * 100 >= CONFIG.threshold.min);
  const choices = points.slice(1); // empty when every risk is below the slider minimum (tiny or degraded data)
  const elbow = best(choices, (point) => point.tpr - point.fpr);
  const bestValue = best(choices, netValue);
  const current = [...points].reverse().find((point) => point.t >= state.threshold) || points[0];
  const room = hasRules(state.room) ? evaluateRules(roomRules(state.room), state.test) : null;
  drawRocChart($("roc"), { points, current, elbow, best: bestValue, room }, (point) =>
    onPick(point.t === Infinity ? CONFIG.threshold.max / 100 : point.t),
  );

  $("pick-elbow").disabled = !elbow;
  $("pick-value").disabled = !bestValue;
  $("pick-elbow").onclick = () => onPick(elbow.t);
  $("pick-value").onclick = () => onPick(bestValue.t);
  const area = term("auc", "Area under the curve");
  $("roc-desc").innerHTML = !elbow
    ? `${area}: <b>${pct(auc(all))}</b>. Every client's risk is below ${CONFIG.threshold.min}%: with this data the model never flags anyone, so there is no threshold to choose.`
    : `${area} (the ranking score of step 3): <b>${pct(auc(all))}</b> (50% = coin flip, 100% = perfect). ` +
      `The <b>${term("elbow", "elbow")}</b> (${thresholdPct(elbow.t)}%) catches the most leavers for the fewest false alarms. ` +
      `But the right point is a business choice: with the € assumptions below, the <b>best value</b> is at ${thresholdPct(bestValue.t)}%. Click any dot to try it.`;
}
