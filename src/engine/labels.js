// Plain-English labels for tree edges, nodes and leaf rules.

/** A number of a signal with its unit; changes (in %) carry their sign: "+8%", "6 months". */
export const formatValue = (v, feature) => `${v > 0 && feature.unit === "%" ? "+" : ""}${v}${feature.unit}`;

/** Short name of a signal, as on the tree's nodes: "Last contact". */
export const shortName = (feature) => feature.short || feature.label;
// integer data: "x <= t" means x <= floor(t), so the other branch starts at floor(t) + 1
const lowerBranchMax = (t) => Math.floor(t);
const upperBranchMin = (t) => Math.floor(t) + 1;
const levelsOnSide = (feature, t, yes) =>
  yes ? feature.levels.slice(0, Math.floor(t) + 1) : feature.levels.slice(Math.floor(t) + 1);

/** Short label on a tree edge; `yes` is the "value <= t" branch. */
export function edgeLabel(feature, t, yes) {
  if (feature.type === "bool") return yes ? "no" : "yes";
  if (feature.type === "ord") return levelsOnSide(feature, t, yes).join(" / ");
  return yes ? `≤ ${formatValue(lowerBranchMax(t), feature)}` : `≥ ${formatValue(upperBranchMin(t), feature)}`;
}

/** The same branch as a full condition, e.g. "Complaint: yes", "Last contact ≥ 6 months". */
function condition(feature, t, yes) {
  if (feature.type === "bool") return `${shortName(feature)}: ${edgeLabel(feature, t, yes)}`;
  if (feature.type === "ord") return `${feature.label}: ${levelsOnSide(feature, t, yes).join(" or ")}`;
  return `${shortName(feature)} ${edgeLabel(feature, t, yes)}`;
}

/** A leaf's path as readable conditions; several conditions on one signal merge into one range. */
export function ruleText(path) {
  const bySignal = new Map();
  for (const step of path) {
    const range = bySignal.get(step.f.key) || { feature: step.f, lo: -Infinity, hi: Infinity };
    if (step.yes) range.hi = Math.min(range.hi, step.t);
    else range.lo = Math.max(range.lo, step.t);
    bySignal.set(step.f.key, range);
  }
  return [...bySignal.values()].map(({ feature, lo, hi }) => {
    if (feature.type === "bool") return condition(feature, 0.5, hi < Infinity);
    if (feature.type === "ord") {
      const from = lo === -Infinity ? 0 : Math.floor(lo) + 1;
      const to = hi === Infinity ? feature.levels.length - 1 : Math.floor(hi);
      return `${feature.label}: ${feature.levels.slice(from, to + 1).join(" or ")}`;
    }
    if (lo > -Infinity && hi < Infinity) {
      const low = formatValue(upperBranchMin(lo), feature);
      return `${shortName(feature)} between ${low} and ${formatValue(lowerBranchMax(hi), feature)}`;
    }
    return condition(feature, lo > -Infinity ? lo : hi, hi < Infinity);
  });
}
