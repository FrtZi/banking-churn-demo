import { FEATURES, shortName } from "../../../engine/index.js";
import { $ } from "../../dom.js";
import { featureCell, featureValue, pct } from "../../format.js";
import { state } from "../../state.js";

/** What a signal looks like in the data: its range, its share of "yes", or its levels. */
function summary(feature, data) {
  const values = data.map((r) => r[feature.key]);
  if (feature.type === "bool") return `${pct(values.filter(Boolean).length / values.length)} of clients`;
  if (feature.type === "ord") return feature.levels.join(" · ");
  return `${featureCell(feature, Math.min(...values))} to ${featureValue(feature, Math.max(...values))}`; // "0 to 18 months"
}

/** Step 2: every signal of the data, to help the room pick realistic thresholds. */
export function drawSignals() {
  $("t-signals").innerHTML = FEATURES.map(
    (f) => `<tr><th scope="row">${shortName(f)}</th><td>${summary(f, state.data)}</td></tr>`,
  ).join("");
}
