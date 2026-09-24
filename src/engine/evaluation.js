import { predict } from "./tree.js";

/** Confusion matrix of any "flag this client?" decision: caught (tp), false alarms (fp), missed (fn), left alone (tn). */
export function confusion(rows, flag) {
  const m = { tp: 0, fp: 0, fn: 0, tn: 0 };
  for (const r of rows) {
    const flagged = flag(r);
    if (flagged && r.churn) m.tp++;
    else if (flagged) m.fp++;
    else if (r.churn) m.fn++;
    else m.tn++;
  }
  return m;
}

/** Confusion matrix of the tree when clients with risk >= threshold are called. */
export const evaluate = (tree, rows, threshold) => confusion(rows, (r) => predict(tree, r) >= threshold);

/**
 * ROC curve: one point per distinct risk level, from "call nobody" (t = Infinity) to "call everybody".
 * At a point, clients with risk >= t are called.
 */
export function roc(tree, rows) {
  const scored = rows.map((r) => ({ risk: predict(tree, r), left: r.churn }));
  const pos = scored.filter((s) => s.left).length;
  const neg = scored.length - pos;
  const levels = [...new Set(scored.map((s) => s.risk))].sort((a, b) => b - a);
  const points = [{ t: Infinity, tpr: 0, fpr: 0, tp: 0, fp: 0, fn: pos, tn: neg }];
  for (const t of levels) {
    const tp = scored.filter((s) => s.risk >= t && s.left).length;
    const fp = scored.filter((s) => s.risk >= t && !s.left).length;
    points.push({ t, tpr: pos ? tp / pos : 0, fpr: neg ? fp / neg : 0, tp, fp, fn: pos - tp, tn: neg - fp });
  }
  return points;
}

/** Area under a piecewise-linear ROC curve. */
export const auc = (points) =>
  points.slice(1).reduce((sum, q, i) => sum + ((q.fpr - points[i].fpr) * (q.tpr + points[i].tpr)) / 2, 0);

/** Ranking score: AUC of a tree on some rows (0.5 = coin flip, 1 = perfect). */
export const score = (tree, rows) => auc(roc(tree, rows));
