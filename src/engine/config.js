/** Every default of the engine. The `data` block is the training default the speaker notes rely on. */
export const DEFAULTS = {
  data: { n: 500, seed: 101, learnShare: 0.8 },
  tree: { maxDepth: 3, minLeaf: 12, minGain: 0.002 },
  search: { maxDepth: 8, folds: 5 },
  batch: { n: 1000, seed: 2026 }, // new clients arriving after go-live
  qualitySeeds: { training: 7, production: 11 },
  psi: { watch: 0.1, alert: 0.25, quantiles: [0.2, 0.4, 0.6, 0.8] },
};

/** Years of the three cohorts: history to learn from, clients kept aside to test, clients after go-live. */
export const COHORTS = { learn: 2024, test: 2025, production: 2026 };
