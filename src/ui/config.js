import { DEFAULTS } from "../engine/index.js";

/** Default minimum group (% of learning clients) = the engine's minLeaf on the default data (12 of 400 = 3%). */
function defaultMinGroupPct() {
  const { n, learnShare } = DEFAULTS.data;
  return Math.round((DEFAULTS.tree.minLeaf / Math.round(n * learnShare)) * 1000) / 10;
}

/** Every tunable value of the user interface. */
export const CONFIG = {
  steps: ["The data", "Your rules", "Train", "Rules", "Results", "Our 8 clients", "Monitor"],
  data: {
    sizes: [100, 200, 500, 1000, 2000, 5000],
    split: { min: 50, max: 95, step: 5 },
    sampleSeedStep: 1009, // seed of sample k = default seed + (k - 1) × step
    previewRows: 12,
    csvFile: "churn_demo_clients.csv",
    warnBelow: { learnLeavers: 25, testLeavers: 10 },
  },
  room: { rules: 3, conditionsPerRule: 2 },
  tree: { depth: DEFAULTS.tree.maxDepth, maxDepth: DEFAULTS.search.maxDepth },
  minGroup: { choices: [0.5, 1, 2, 3, 5, 10], value: defaultMinGroupPct() }, // % of the learning clients
  searchAnimation: { foldMs: 90, depthMs: 160 },
  inference: {
    // default data: three unseen test clients (not the game's 8, so step 6 is not spoiled); #422 and #401 look
    // alike and share a risk with a sensible tree, but an overfitted tree sends them to 0% and 100%
    ids: ["C422", "C401", "C480"],
    // other data: the three unseen clients whose risk moves most between these two trees
    sensible: { depth: DEFAULTS.tree.maxDepth, minGroupPct: defaultMinGroupPct() },
    overfitted: { depth: DEFAULTS.search.maxDepth, minGroupPct: 0.5 },
  },
  threshold: { min: 5, max: 60, value: 30 }, // % risk above which a client is called
  business: {
    revenuePerLeaver: { value: 12000, step: 1000 }, // €/year lost when a client leaves
    callCost: { value: 150, step: 50 }, // € per retention call
    savedShare: { value: 30, step: 5, max: 100 }, // % of called leavers who stay thanks to the call
  },
  riskScale: { colourMax: 0.6, barMax: 0.7 }, // share of leavers mapped to the darkest colour / the full bar
};

/** The training default data: every figure in the speaker notes assumes it. */
export const DEFAULT_DATA = {
  n: DEFAULTS.data.n,
  split: Math.round(DEFAULTS.data.learnShare * 100),
  sample: 1,
};
