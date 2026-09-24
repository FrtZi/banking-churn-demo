import { DEFAULTS } from "./config.js";

/** Buckets of a signal: reference quantiles for numbers, the value itself for yes/no and levels. */
function bucketsFor(ref, feature) {
  if (feature.type !== "num") return (x) => String(x[feature.key]);
  const values = ref.map((x) => x[feature.key]).sort((a, b) => a - b);
  const edges = [...new Set(DEFAULTS.psi.quantiles.map((q) => values[Math.floor(q * (values.length - 1))]))];
  return (x) => edges.filter((e) => x[feature.key] > e).length;
}

/**
 * Population Stability Index of one signal between the learning data (ref) and new data (cur). Usual reading:
 * below DEFAULTS.psi.watch stable, above DEFAULTS.psi.alert alert.
 */
export function psi(ref, cur, feature) {
  const bucket = bucketsFor(ref, feature);
  const shares = (rows) =>
    rows.reduce((m, x) => m.set(bucket(x), (m.get(bucket(x)) || 0) + 1 / rows.length), new Map());
  const a = shares(ref);
  const b = shares(cur);
  const eps = 1e-4;
  return [...new Set([...a.keys(), ...b.keys()])].reduce((sum, k) => {
    const p = Math.max(a.get(k) || 0, eps);
    const q = Math.max(b.get(k) || 0, eps);
    return sum + (q - p) * Math.log(q / p);
  }, 0);
}
