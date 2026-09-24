import { COHORTS, countLeavers, DEFAULTS, degradeTraining, generate, newBatch } from "../engine/index.js";
import { CONFIG, DEFAULT_DATA } from "./config.js";
import { emptyRoom } from "./room-model.js";

/**
 * The single mutable state of the page. Bindings (steps/*\/bind.js) write it, drawing functions read it,
 * render.js decides what to redraw.
 */
export const state = {
  gen: { ...DEFAULT_DATA, quality: {} }, // quality: { issueKey: parameter value }
  data: [], // all clients shown in step 1
  train: [], // learning-cohort clients the model learns from (possibly degraded)
  test: [], // test-cohort clients kept aside, always clean
  tree: null,
  depth: CONFIG.tree.depth,
  minGroupIndex: CONFIG.minGroup.choices.indexOf(CONFIG.minGroup.value),
  threshold: CONFIG.threshold.value / 100,
  business: Object.fromEntries(Object.entries(CONFIG.business).map(([k, v]) => [k, v.value])),
  search: null, // { curve, best } once "Find the best level" has run
  shown: 0, // depths of the validation curve drawn so far (grows during the animation)
  searching: false,
  searchRun: 0, // incremented to cancel a running search animation
  room: emptyRoom(), // the room's rules: rules × conditions (AND inside a rule, OR between rules)
  roomMissing: "", // signals the room used that are not in the data
  prodIssues: {}, // step 7: { issueKey: share of new clients affected }
  batch: newBatch(), // step 7: always the same batch of production-cohort clients
  revealed: false,
  step: 0,
};

const seedOf = (sample) => DEFAULTS.data.seed + (sample - 1) * CONFIG.data.sampleSeedStep;

/** Regenerates the clients from state.gen; bad data quality hits the learning history only. */
export function makeData() {
  const { n, split, sample, quality } = state.gen;
  const raw = generate(n, seedOf(sample), split / 100);
  state.train = degradeTraining(
    raw.filter((r) => r.cohort === COHORTS.learn),
    quality,
  );
  state.test = raw.filter((r) => r.cohort === COHORTS.test);
  state.data = [...state.train, ...state.test];
}

export const isDefaultData = () => {
  const { n, split, sample, quality } = state.gen;
  return (
    n === DEFAULT_DATA.n &&
    split === DEFAULT_DATA.split &&
    sample === DEFAULT_DATA.sample &&
    !Object.keys(quality).length
  );
};
export const minGroupPct = () => CONFIG.minGroup.choices[state.minGroupIndex];
export const minLeafFor = (pctOfLearning) => Math.max(1, Math.round((pctOfLearning / 100) * state.train.length));
export const minLeaf = () => minLeafFor(minGroupPct());
export const searchDone = () => Boolean(state.search) && state.shown === state.search.curve.length;

/** Calls made and net value of a campaign described by a confusion matrix. */
export const calls = (m) => m.tp + m.fp;
export const netValue = (m) => {
  const { revenuePerLeaver, callCost, savedShare } = state.business;
  return m.tp * (savedShare / 100) * revenuePerLeaver - calls(m) * callCost;
};
export const leaverRate = (rows) => countLeavers(rows) / rows.length;
