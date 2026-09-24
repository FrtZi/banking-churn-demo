import { evaluate } from "../../../engine/index.js";
import { $, setTexts } from "../../dom.js";
import { eur, pct } from "../../format.js";
import { calls, netValue, state } from "../../state.js";

/** Step 5: threshold read-out, confusion matrix, sensitivity / specificity, calls, accuracy trap, net value. */
export function drawResults() {
  const { test } = state;
  const thrPct = pct(state.threshold);
  const m = evaluate(state.tree, test, state.threshold);
  const leavers = m.tp + m.fn;
  const net = netValue(m);
  $("thr").value = Math.round(state.threshold * 100);
  $("thr").setAttribute("aria-valuetext", `${thrPct} risk`);
  setTexts({
    "thr-o": thrPct,
    "g-thr": thrPct,
    "r-test": test.length,
    "m-tp": m.tp,
    "m-fp": m.fp,
    "m-fn": m.fn,
    "m-tn": m.tn,
    "r-calls": calls(m),
    "r-caught": `${m.tp} of the ${leavers} leavers caught · ${calls(m) ? pct(m.tp / calls(m)) : "–"} of calls are useful`,
    "r-acc": pct((m.tp + m.tn) / test.length),
    "r-sens": leavers ? pct(m.tp / leavers) : "–",
    "r-spec": pct(m.tn / (m.tn + m.fp)),
    "r-net": `${net >= 0 ? "▲" : "▼"} ${eur(net)} / yr`,
  });
  $("r-base").innerHTML =
    `A “model” that says <b>nobody leaves</b> scores ${pct((m.tn + m.fp) / test.length)} without catching a single leaver. Accuracy alone is misleading.`;
  $("r-net").className = `big ${net >= 0 ? "gain" : "loss"}`;
}
