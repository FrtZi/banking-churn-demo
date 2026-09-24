import { $ } from "../../dom.js";
import { state } from "../../state.js";

// Start / end / cancel of the "Find the best level" animation (no rendering here, so render.js can use it).

const controls = () => ["search", "depth", "minpct"].map($);

/** Locks the step 3 controls; returns the id of this run. */
export function startSearch() {
  state.searching = true;
  controls().forEach((c) => (c.disabled = true));
  return ++state.searchRun;
}

/** Unlocks the controls and shows every fold again. */
export function endSearch() {
  state.searching = false;
  controls().forEach((c) => (c.disabled = false));
  [...$("folds").children].forEach((x) => x.classList.remove("hidden-fold"));
}

/** Stops a running animation (e.g. the data changed under it): its remaining steps become no-ops. */
export function cancelSearch() {
  state.searchRun++;
  if (state.searching) endSearch();
}

/** True once the run `run` has been cancelled or superseded. */
export const isCancelled = (run) => run !== state.searchRun;
