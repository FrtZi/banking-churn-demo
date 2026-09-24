// Text formatting shared by every step.
import { formatValue, shortName } from "../engine/index.js";

export const pct = (x) => `${Math.round(x * 100)}%`;
export const int = (x) => x.toLocaleString("en-US");
export const eur = (x) => `${x < 0 ? "−" : ""}€${int(Math.abs(Math.round(x)))}`;
export const plural = (n, word) => `${word}${n === 1 ? "" : "s"}`;

/** A client's value of a signal as people read it: "+8%", "6 months", "yes", "dropping". */
export function featureValue(feature, v) {
  if (feature.type === "bool") return v ? "yes" : "no";
  if (feature.type === "ord") return v;
  return formatValue(v, feature);
}

// a unit written as a word ("months", "yrs") goes in a table's header once; "%" stays with each value
const unitWord = (feature) => (feature.type === "num" && feature.unit !== "%" ? feature.unit.trim() : "");

/** A signal's value in a table cell or a range start: "+8%", "6", "yes" (the unit word is in the header). */
export const featureCell = (feature, v) => (unitWord(feature) ? String(v) : featureValue(feature, v));

/** A table header for a signal: "Last contact (months)". */
export const featureHeader = (feature) =>
  unitWord(feature) ? `${shortName(feature)} (${unitWord(feature)})` : shortName(feature);

/** A threshold as the slider shows it: rounded down, so "risk ≥ 33%" still includes a 33.3% risk. */
export const thresholdPct = (t) => Math.floor(t * 100 + 1e-9);

/** Status icons: always paired with a label, never colour alone. */
export const icon = (status, glyph) => `<span class="ico-${status}" aria-hidden="true">${glyph}</span>`;
export const warn = (html) => `${icon("warning", "⚠")} ${html}`;
