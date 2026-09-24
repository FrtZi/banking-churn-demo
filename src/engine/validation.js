import { DEFAULTS } from "./config.js";
import { score } from "./evaluation.js";
import { train } from "./tree.js";

/**
 * k-fold cross-validation on the learning clients only: hide 1/k, learn on the rest, score the hidden part,
 * k times. Folds are fixed (row i goes to fold i % k) so the demo is reproducible.
 */
export function crossValidate(rows, maxDepth, minLeaf, k = DEFAULTS.search.folds) {
  const folds = [];
  for (let fold = 0; fold < k; fold++) {
    const hidden = rows.filter((_, i) => i % k === fold);
    const learn = rows.filter((_, i) => i % k !== fold);
    folds.push(score(train(learn, maxDepth, minLeaf), hidden));
  }
  return { mean: folds.reduce((a, b) => a + b, 0) / k, folds };
}

/** Score on learned vs hidden clients for every depth; best = highest hidden score (ties: simpler tree). */
export function depthSearch(rows, minLeaf, maxDepth = DEFAULTS.search.maxDepth) {
  const curve = [];
  for (let depth = 1; depth <= maxDepth; depth++) {
    curve.push({
      depth,
      learned: score(train(rows, depth, minLeaf), rows),
      hidden: crossValidate(rows, depth, minLeaf).mean,
    });
  }
  const best = curve.reduce((b, c) => (c.hidden > b.hidden + 1e-9 ? c : b));
  return { curve, best: best.depth };
}
