import { train } from "../engine/index.js";
import { CONFIG } from "./config.js";
import { $ } from "./dom.js";
import { thresholdPct } from "./format.js";
import { makeData, minLeaf, state } from "./state.js";
import { drawClients } from "./steps/clients/draw.js";
import { drawData } from "./steps/data/draw.js";
import { drawMonitor } from "./steps/monitor/draw.js";
import { drawSignals } from "./steps/room/signals.js";
import { drawResults } from "./steps/results/draw.js";
import { drawRoc } from "./steps/results/roc.js";
import { drawRoomScore } from "./steps/rules/room-score.js";
import { drawRules } from "./steps/rules/draw.js";
import { drawTrainControls, drawTree, drawValidation } from "./steps/train/draw.js";
import { drawInference } from "./steps/train/inference.js";
import { cancelSearch } from "./steps/train/search-state.js";

/*
 * The render pipeline: which drawings depend on which state. Bindings change the state, then call ONE of these.
 *
 *   regenerate ─► retrain ─► refresh ─► refreshRoom
 *   (data)        (tree)     (threshold, € assumptions)   (room's rules)
 */

/** The room's rules changed: their score against the machine and their point on the ROC curve. */
export function refreshRoom() {
  drawRoomScore();
  drawRoc(setThreshold);
}

/** The threshold or the € assumptions changed: everything computed from the model's decisions. */
export function refresh() {
  drawResults();
  refreshRoom();
  drawMonitor();
  drawRules();
  drawClients();
}

/** The model settings changed: new tree, then everything downstream. */
export function retrain() {
  state.tree = train(state.train, state.depth, minLeaf());
  drawTrainControls();
  drawTree();
  refresh();
  drawValidation();
  drawInference();
}

/** The data settings changed: new clients, a stale depth search is dropped, then everything downstream. */
export function regenerate() {
  cancelSearch();
  makeData();
  state.search = null;
  state.shown = 0;
  drawData();
  drawSignals();
  retrain();
}

/** Screen-reader announcement of the threshold's effect (once, not on every slider step). */
export const announceThreshold = () => ($("sr-status").textContent = $("r-caught").textContent);

/** Moves the threshold to a risk `t` (0–1), kept within the slider's range. */
export function setThreshold(t) {
  const { min, max } = CONFIG.threshold;
  state.threshold = Math.max(min, Math.min(max, thresholdPct(t))) / 100;
  refresh();
  announceThreshold();
}
