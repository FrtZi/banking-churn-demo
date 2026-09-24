import { DEFAULTS, INFERENCE_ISSUES } from "../../../engine/index.js";
import { renderIssueRows } from "../../components/issue-rows.js";
import { $ } from "../../dom.js";
import { int } from "../../format.js";
import { term } from "../../glossary/links.js";
import { state } from "../../state.js";
import { drawMonitor } from "./draw.js";

/** Step 7 controls: tick boxes that break the incoming data; plus the batch size and the PSI reading guide. */
export function bindMonitorStep() {
  const { watch, alert } = DEFAULTS.psi;
  const [w, a] = [watch.toFixed(2), alert.toFixed(2)];
  $("mon-n").textContent = int(state.batch.length);
  $("psi-help").innerHTML =
    `Each signal of the new batch compared with the data the model learned from (${term("psi", "Population Stability Index")}: ` +
    `below ${w} stable, ${w}–${a} watch, above ${a} alert).`;
  renderIssueRows($("inf-issues"), "prod", INFERENCE_ISSUES, state.prodIssues, drawMonitor);
}
