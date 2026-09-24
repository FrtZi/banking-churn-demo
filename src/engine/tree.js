import { DEFAULTS } from "./config.js";
import { FEATURES, valueOf } from "./features.js";

// CART decision tree with the Gini impurity.

/** Number of clients who left. */
export const countLeavers = (rows) => rows.reduce((sum, r) => sum + r.churn, 0);
const gini = (leavers, n) => (n ? 1 - (leavers / n) ** 2 - (1 - leavers / n) ** 2 : 0);

/** The split (signal + threshold) that reduces impurity most, keeping at least `minLeaf` clients per side. */
function bestSplit(rows, minLeaf) {
  const n = rows.length;
  const leavers = countLeavers(rows);
  const parentImpurity = gini(leavers, n);
  let best = null;
  for (const feature of FEATURES) {
    const sorted = rows.map((r) => [valueOf(r, feature), r.churn]).sort((a, b) => a[0] - b[0]);
    let leftLeavers = 0;
    for (let i = 0; i < n - 1; i++) {
      leftLeavers += sorted[i][1];
      const leftN = i + 1;
      if (sorted[i][0] === sorted[i + 1][0] || leftN < minLeaf || n - leftN < minLeaf) continue;
      const gain =
        parentImpurity -
        (leftN / n) * gini(leftLeavers, leftN) -
        ((n - leftN) / n) * gini(leavers - leftLeavers, n - leftN);
      if (!best || gain > best.gain) best = { feature, threshold: (sorted[i][0] + sorted[i + 1][0]) / 2, gain };
    }
  }
  return best;
}

/**
 * Trains a tree. A node is `{ n, pos, p, depth }` (clients, leavers, share of leavers); a split node also
 * has `f` (feature), `t` (threshold), `yes` (value <= t) and `no`.
 */
export function train(rows, maxDepth = DEFAULTS.tree.maxDepth, minLeaf = DEFAULTS.tree.minLeaf, depth = 0) {
  const n = rows.length;
  const pos = countLeavers(rows);
  const node = { n, pos, p: n ? pos / n : 0, depth };
  if (depth >= maxDepth || pos === 0 || pos === n) return node;
  const split = bestSplit(rows, minLeaf);
  if (!split || split.gain < DEFAULTS.tree.minGain) return node;
  node.f = split.feature;
  node.t = split.threshold;
  node.yes = train(
    rows.filter((r) => valueOf(r, node.f) <= node.t),
    maxDepth,
    minLeaf,
    depth + 1,
  );
  node.no = train(
    rows.filter((r) => valueOf(r, node.f) > node.t),
    maxDepth,
    minLeaf,
    depth + 1,
  );
  return node;
}

function leafOf(node, row) {
  let current = node;
  while (current.f) current = valueOf(row, current.f) <= current.t ? current.yes : current.no;
  return current;
}

/** Risk of a client = share of leavers in its leaf. */
export const predict = (tree, row) => leafOf(tree, row).p;

/** All leaves with the path of conditions that leads to each. */
export function leaves(node, path = [], out = []) {
  if (!node.f) {
    out.push({ node, path });
    return out;
  }
  leaves(node.yes, [...path, { f: node.f, t: node.t, yes: true }], out);
  leaves(node.no, [...path, { f: node.f, t: node.t, yes: false }], out);
  return out;
}
