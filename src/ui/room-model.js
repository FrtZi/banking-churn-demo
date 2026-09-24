import { featureByKey, FEATURES, shortName } from "../engine/index.js";
import { CONFIG } from "./config.js";
import { featureValue } from "./format.js";

// The room's rules as edited in the builder, and their conversion to the engine's rule format.
// The signals are the engine's FEATURES; only the builder's defaults for numbers are set here.

/** Numeric signals: comparisons offered (the likely one first), default value and input step. */
const NUMBER_INPUTS = {
  assets: { ops: ["le", "ge"], def: -20, step: 5 },
  contact: { ops: ["ge", "le"], def: 6, step: 1 },
  products: { ops: ["le", "ge"], def: 1, step: 1 },
  tenure: { ops: ["le", "ge"], def: 3, step: 1 },
  age: { ops: ["ge", "le"], def: 60, step: 5 },
};
const LOW_APP_USAGE = featureByKey("app").levels.slice(0, 2); // none, dropping
const ANY_LOW_APP_USAGE = LOW_APP_USAGE.join(" or ");

function signalOf(feature) {
  if (feature.type === "bool") return { feature, bool: true };
  if (feature.type === "ord") return { feature, choices: [...feature.levels, ANY_LOW_APP_USAGE] };
  return { feature, ...NUMBER_INPUTS[feature.key] };
}

/** Signals offered in the rule builder, keyed like the engine's features. */
export const SIGNALS = Object.fromEntries(FEATURES.map((f) => [f.key, signalOf(f)]));
export const OP_LABEL = { le: "at most", ge: "at least" };

/** An empty builder grid: rules × conditions, every condition unset. */
export const emptyRoom = () =>
  Array.from({ length: CONFIG.room.rules }, () => Array(CONFIG.room.conditionsPerRule).fill(null));

/** A fresh builder condition for a signal (null when no signal is chosen). */
export function newCondition(key) {
  if (!key) return null;
  const s = SIGNALS[key];
  if (s.bool) return { key, yes: true };
  if (s.choices) return { key, choice: ANY_LOW_APP_USAGE };
  return { key, op: s.ops[0], value: s.def };
}

/** Engine condition -> builder condition. */
function fromEngine(c) {
  const s = SIGNALS[c.key];
  if (s.bool) return { key: c.key, yes: c.value === 1 };
  if (s.choices) return { key: c.key, choice: c.op === "in" ? ANY_LOW_APP_USAGE : c.value };
  return { key: c.key, op: c.op, value: c.value };
}

/** Builder condition -> engine condition. */
function toEngine(c) {
  const s = SIGNALS[c.key];
  if (s.bool) return { key: c.key, op: "is", value: c.yes ? 1 : 0 };
  if (s.choices) {
    return c.choice === ANY_LOW_APP_USAGE
      ? { key: c.key, op: "in", value: LOW_APP_USAGE }
      : { key: c.key, op: "is", value: c.choice };
  }
  return { key: c.key, op: c.op, value: c.value };
}

/** Engine rules (e.g. the example) -> builder grid with the configured number of conditions per rule. */
export const roomFromEngine = (rules) =>
  rules.map((rule) =>
    Array.from({ length: CONFIG.room.conditionsPerRule }, (_, j) => (rule[j] ? fromEngine(rule[j]) : null)),
  );

/** The room's rules in the engine's format (unset conditions dropped). */
export const roomRules = (room) => room.map((rule) => rule.filter(Boolean).map(toEngine));
export const hasRules = (room) => roomRules(room).some((r) => r.length);

/** A builder condition in plain English, with the tree's names: "Last contact ≥ 6 months". */
export function describe(c) {
  const { feature } = SIGNALS[c.key];
  if (c.op) return `${shortName(feature)} ${c.op === "le" ? "≤" : "≥"} ${featureValue(feature, c.value)}`;
  return `${feature.label}: ${"yes" in c ? featureValue(feature, c.yes) : c.choice}`;
}
