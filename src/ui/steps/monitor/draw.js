import { DEFAULTS, degradeBatch, evaluate, FEATURES, leaves, psi, score } from "../../../engine/index.js";
import { $ } from "../../dom.js";
import { icon, int, pct, plural } from "../../format.js";
import { calls, state } from "../../state.js";

const { watch: PSI_WATCH, alert: PSI_ALERT } = DEFAULTS.psi;
const STATUS = [
  [PSI_WATCH, "good", "✔", "Stable"],
  [PSI_ALERT, "warning", "⚠", "Watch"],
  [Infinity, "critical", "✘", "Alert"],
];

function driftTable(drift) {
  const used = new Set(leaves(state.tree).flatMap((l) => l.path.map((c) => c.f.key)));
  const head = `<tr><th scope="col">Signal</th><th scope="col">PSI</th><th scope="col">Used by the model</th><th scope="col">Status</th></tr>`;
  return (
    head +
    drift
      .map(({ f, value }) => {
        const [, status, glyph, label] = STATUS.find(([below]) => value < below);
        return (
          `<tr><th scope="row">${f.short || f.label}</th><td>${value.toFixed(2)}</td><td>${used.has(f.key) ? "yes" : "no"}</td>` +
          `<td class="status">${icon(status, glyph)} ${label}</td></tr>`
        );
      })
      .join("")
  );
}

const kv = (k, v, ref) =>
  `<div class="kv"><span>${k}</span><b>${v}${String(ref) !== String(v) ? ` <span class="note">(clean data: ${ref})</span>` : ""}</b></div>`;

function message(alerts, missed) {
  const { batch, test, tree } = state;
  if (!Object.keys(state.prodIssues).length) {
    return (
      `Clean data: every signal is stable. Note the ranking score on ${int(batch.length)} new clients (${pct(score(tree, batch))}) ` +
      `versus ${pct(score(tree, test))} on the ${int(test.length)} test clients of step 5: a small test set can flatter a model.`
    );
  }
  return (
    `${missed ? icon("critical", "✘") : icon("warning", "⚠")} The drift monitor raises ${alerts} ${plural(alerts, "alert")} today. ` +
    (missed
      ? `Without it, the business would only notice in months: ${missed} leavers missed.`
      : "This time the model barely suffers: an alert must be qualified, not just raised.")
  );
}

/** Step 7: drift per signal (PSI), what the model does today and what it costs once outcomes arrive. */
export function drawMonitor() {
  const { batch: clean, tree } = state;
  const batch = degradeBatch(clean, state.prodIssues);
  const drift = FEATURES.map((f) => ({ f, value: psi(state.train, batch, f) }));
  const before = evaluate(tree, clean, state.threshold);
  const now = evaluate(tree, batch, state.threshold);
  const leavers = before.tp + before.fn;
  $("t-psi").innerHTML = driftTable(drift);
  $("mon-now").innerHTML = kv(`Clients flagged to call (risk ≥ ${pct(state.threshold)})`, calls(now), calls(before));
  $("mon-later").innerHTML =
    kv("Leavers caught", `${now.tp} / ${leavers}`, `${before.tp} / ${leavers}`) +
    kv("Ranking score", pct(score(tree, batch)), pct(score(tree, clean)));
  const alerts = drift.filter((d) => d.value >= PSI_ALERT).length;
  $("mon-msg").innerHTML = message(alerts, Math.max(0, before.tp - now.tp));
}
