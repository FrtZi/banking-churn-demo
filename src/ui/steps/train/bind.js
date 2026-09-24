import { COHORTS, DEFAULTS, depthSearch } from "../../../engine/index.js";
import { CONFIG } from "../../config.js";
import { $ } from "../../dom.js";
import { term } from "../../glossary/links.js";
import { retrain } from "../../render.js";
import { minLeaf, state } from "../../state.js";
import { runSearch } from "./search.js";

/** Step 3 controls: depth, minimum group size, automatic search; plus the cross-validation help text. */
export function bindTrainStep() {
  Object.assign($("depth"), { min: 1, max: CONFIG.tree.maxDepth, step: 1 });
  Object.assign($("minpct"), { min: 0, max: CONFIG.minGroup.choices.length - 1, step: 1 });
  const k = DEFAULTS.search.folds;
  $("folds").innerHTML = "<i></i>".repeat(k);
  $("cv-help").innerHTML =
    `${term("cv", "Cross-validation")}: hide 1/${k} of the ${COHORTS.learn} clients, learn on the other ${k - 1}/${k}, score on the hidden part; ${k} times. ` +
    `The ${COHORTS.test} clients stay untouched for step 5.`;
  $("depth").oninput = () => {
    state.depth = +$("depth").value;
    retrain();
  };
  $("minpct").oninput = () => {
    state.minGroupIndex = +$("minpct").value;
    if (state.search) {
      state.search = depthSearch(state.train, minLeaf());
      state.shown = state.search.curve.length;
    }
    retrain();
  };
  $("search").onclick = runSearch;
}
