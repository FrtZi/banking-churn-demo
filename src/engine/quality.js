import { DEFAULTS } from "./config.js";
import { rng } from "./random.js";

// Each issue has one parameter (`param.def` is its default). An `issues` argument maps the ticked issue keys
// to their parameter value: { labelNoise: 35 }.

/** Problems in the history the model learns from (applied to the learning cohort only). */
export const TRAINING_ISSUES = {
  missingContact: {
    label: "Missing last-contact dates, filled with 0 by the system",
    param: { name: "clients affected", min: 5, max: 90, step: 5, def: 30, unit: "%" },
    apply: (rows, rand, v) => rows.map((x) => (rand() < v / 100 ? { ...x, contact: 0 } : x)),
  },
  complaintsLost: {
    label: "Complaints not logged for part of the year",
    param: { name: "complaints lost", min: 10, max: 100, step: 10, def: 60, unit: "%" },
    apply: (rows, rand, v) => rows.map((x) => (x.complaint && rand() < v / 100 ? { ...x, complaint: 0 } : x)),
  },
  labelNoise: {
    label: 'Wrong outcome: account closures recorded as "stayed"',
    param: { name: "leavers mislabelled", min: 5, max: 90, step: 5, def: 35, unit: "%" },
    apply: (rows, rand, v) => rows.map((x) => (x.churn && rand() < v / 100 ? { ...x, churn: 0 } : x)),
  },
  sampleBias: {
    label: "Biased sample: history only kept for younger clients",
    param: { name: "kept if under", min: 30, max: 75, step: 5, def: 50, unit: " years" },
    apply: (rows, rand, v) => rows.filter((x) => x.age < v),
  },
};

/** Applies the ticked training issues ({ key: parameter }) to the learning clients; same seed, same damage. */
export function degradeTraining(rows, issues, seed = DEFAULTS.qualitySeeds.training) {
  const rand = rng(seed);
  return Object.keys(TRAINING_ISSUES).reduce(
    (out, k) => (k in issues ? TRAINING_ISSUES[k].apply(out, rand, issues[k]) : out),
    rows,
  );
}

// Problems in the data flowing into a model in production. The parameter is the share of new clients hit
// (100% = the whole feed is broken; less = a partial outage, harder to spot).
const SHARE_AFFECTED = { name: "new clients affected", min: 10, max: 100, step: 10, def: 100, unit: "%" };

export const INFERENCE_ISSUES = {
  complaintsStop: {
    label: "Complaint feed broken: complaints no longer arrive",
    param: SHARE_AFFECTED,
    apply: (x) => ({ ...x, complaint: 0 }),
  },
  contactZero: {
    label: "CRM migration: last-contact date defaults to 0",
    param: SHARE_AFFECTED,
    apply: (x) => ({ ...x, contact: 0 }),
  },
  appBroken: {
    label: 'App tracking stopped: clients show "none"',
    param: SHARE_AFFECTED,
    apply: (x) => ({ ...x, app: "none" }),
  },
  assetsRatio: {
    label: "Format change: assets delivered as a ratio (-0.2) instead of % (-20)",
    param: SHARE_AFFECTED,
    apply: (x) => ({ ...x, assets: Math.round(x.assets) / 100 }),
  },
};

/** Applies the ticked production issues ({ key: share affected }) to a batch of new clients. */
export function degradeBatch(rows, issues, seed = DEFAULTS.qualitySeeds.production) {
  const rand = rng(seed);
  return rows.map((row) =>
    Object.keys(INFERENCE_ISSUES).reduce((x, k) => {
      const hit = rand() < (issues[k] ?? 0) / 100; // one draw per client and issue, ticked or not: reproducible
      return hit ? INFERENCE_ISSUES[k].apply(x) : x;
    }, row),
  );
}
