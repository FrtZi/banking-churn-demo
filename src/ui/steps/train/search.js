import { depthSearch, train } from "../../../engine/index.js";
import { CONFIG } from "../../config.js";
import { $, reduceMotion, sleep } from "../../dom.js";
import { retrain } from "../../render.js";
import { minLeaf, state } from "../../state.js";
import { drawTrainControls, drawTree, drawValidation } from "./draw.js";
import { drawInference } from "./inference.js";
import { endSearch, isCancelled, startSearch } from "./search-state.js";

/** Lights the cross-validation folds one after the other (one fold hidden at a time). */
async function animateFolds(run) {
  const folds = [...$("folds").children];
  for (const fold of folds) {
    folds.forEach((x) => x.classList.toggle("hidden-fold", x === fold));
    await sleep(CONFIG.searchAnimation.foldMs);
    if (isCancelled(run)) return false;
  }
  return true;
}

/** "Find the best level": scores every depth on hidden clients, showing each tree and curve point in turn. */
export async function runSearch() {
  if (state.searching) return;
  const run = startSearch();
  state.search = depthSearch(state.train, minLeaf());
  if (reduceMotion()) {
    state.shown = state.search.curve.length;
  } else {
    $("vc-desc").textContent = "Measuring each level on hidden clients…";
    for (state.shown = 0; state.shown < state.search.curve.length;) {
      state.depth = state.shown + 1;
      state.tree = train(state.train, state.depth, minLeaf());
      drawTrainControls();
      drawTree();
      drawInference();
      if (!(await animateFolds(run))) return;
      state.shown++;
      drawValidation();
      await sleep(CONFIG.searchAnimation.depthMs);
      if (isCancelled(run)) return;
    }
  }
  state.depth = state.search.best;
  endSearch();
  retrain();
}
