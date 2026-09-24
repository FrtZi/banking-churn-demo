import { CONFIG } from "../../config.js";
import { $, readNumber } from "../../dom.js";
import { announceThreshold, refresh } from "../../render.js";
import { state } from "../../state.js";

const BUSINESS_INPUTS = { "v-client": "revenuePerLeaver", "v-call": "callCost", "v-save": "savedShare" };

/** Step 5 controls: threshold slider and business assumptions. */
export function bindResultsStep() {
  const { min, max } = CONFIG.threshold;
  Object.assign($("thr"), { min, max, step: 1 });
  $("thr").oninput = () => {
    state.threshold = +$("thr").value / 100;
    refresh();
  };
  $("thr").onchange = announceThreshold; // once, when the slider is released
  for (const [id, key] of Object.entries(BUSINESS_INPUTS)) {
    const { max: limit, ...attributes } = CONFIG.business[key];
    Object.assign($(id), limit ? { ...attributes, max: limit } : attributes);
    $(id).oninput = () => {
      state.business[key] = readNumber($(id), limit);
      refresh();
    };
  }
}
