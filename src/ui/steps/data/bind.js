import { TRAINING_ISSUES } from "../../../engine/index.js";
import { renderIssueRows } from "../../components/issue-rows.js";
import { CONFIG, DEFAULT_DATA } from "../../config.js";
import { $ } from "../../dom.js";
import { regenerate } from "../../render.js";
import { state } from "../../state.js";
import { downloadCsv } from "./csv.js";

const drawTrainingIssues = () =>
  renderIssueRows($("train-issues"), "train", TRAINING_ISSUES, state.gen.quality, regenerate);

/** Step 1 controls: size, split, sample, reset, bad data quality, CSV download. */
export function bindDataStep() {
  $("gen-n").innerHTML = CONFIG.data.sizes.map((n) => `<option>${n}</option>`).join("");
  Object.assign($("gen-split"), CONFIG.data.split);
  $("gen-n").onchange = () => {
    state.gen.n = +$("gen-n").value;
    regenerate();
  };
  $("gen-split").oninput = () => {
    state.gen.split = +$("gen-split").value;
    regenerate();
  };
  $("gen-new").onclick = () => {
    state.gen.sample += 1;
    regenerate();
  };
  $("gen-reset").onclick = () => {
    state.gen = { ...DEFAULT_DATA, quality: {} };
    drawTrainingIssues();
    regenerate();
  };
  $("csv").onclick = downloadCsv;
  drawTrainingIssues();
}
