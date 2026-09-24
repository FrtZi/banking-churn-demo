import { confusion } from "./evaluation.js";

/**
 * Hand-written rules (the room's rules). A condition is `{ key, op, value }` with op "le" (<=), "ge" (>=),
 * "is" (===) or "in" (one of value[]). A rule is a list of conditions joined by AND; a client is called if
 * ANY rule matches (OR).
 */
export function matches(cond, row) {
  const v = row[cond.key];
  if (cond.op === "le") return v <= cond.value;
  if (cond.op === "ge") return v >= cond.value;
  if (cond.op === "is") return v === cond.value;
  if (cond.op === "in") return cond.value.includes(v);
  throw new Error(`unknown operator ${cond.op}`);
}

const anyRuleMatches = (rules, row) => rules.some((rule) => rule.length > 0 && rule.every((c) => matches(c, row)));

/** Confusion matrix of the rules on some clients. */
export const evaluateRules = (rules, rows) => confusion(rows, (r) => anyRuleMatches(rules, r));
