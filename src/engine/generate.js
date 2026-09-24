import { COHORTS, DEFAULTS } from "./config.js";
import { APP_LEVELS } from "./features.js";
import { rng } from "./random.js";
import { WORLD } from "./world.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const clientId = (prefix, i, digits) => `${prefix}${String(i + 1).padStart(digits, "0")}`;

/** Logistic score of leaving, from the true (not always observed) situation of a client. */
function churnScore(c, rand) {
  const w = WORLD.churn;
  let z = w.base;
  z += (w.assets.find(([below]) => c.trueAssets < below) || [0, 0])[1];
  z += (w.contact.find(([atLeast]) => c.contact >= atLeast) || [0, 0])[1];
  z += c.advisor * w.advisor + c.complaint * w.complaint + (w.app[c.app] || 0);
  z += w.perExtraProduct * (c.products - 1) + w.perTenureYear * c.tenure;
  return z + rand.norm() * w.noise;
}

/** One synthetic client. The draw order matters: it fixes the random stream, hence the whole dataset. */
function drawClient(rand) {
  const W = WORLD;
  const age = Math.round(clamp(W.age.from + rand() * W.age.span + rand.norm() * W.age.noise, W.age.min, W.age.max));
  const tenure = Math.max(1, Math.round(rand() * Math.min(W.tenure.max, age - W.tenure.careerStart)));
  const products = rand.pick(W.products.values, W.products.weights);
  const trueAssets = Math.round(clamp(W.assets.mean + rand.norm() * W.assets.sd, W.assets.min, W.assets.max));
  const contact = Math.round(clamp(-Math.log(1 - rand()) * W.contact.meanMonths, 0, W.contact.max));
  const advisor = rand() < W.advisorChange ? 1 : 0;
  const complaint = rand() < W.complaint ? 1 : 0;
  const appWeights = age > 65 ? W.appWeights.over65 : age > 45 ? W.appWeights.over45 : W.appWeights.younger;
  const app = rand.pick(APP_LEVELS, appWeights);
  // hidden facts, never exported: they explain errors no model can avoid
  const competitorOffer = rand() < W.competitorOffer.rate;
  const housePurchase = rand() < W.housePurchase.rate;

  const z = churnScore({ trueAssets, contact, advisor, complaint, app, products, tenure }, rand);
  let churn = rand() < 1 / (1 + Math.exp(-z)) ? 1 : 0;
  if (competitorOffer && rand() < W.competitorOffer.churn) churn = 1;
  // a house purchase drains assets but the client stays: the data only sees the drop
  const [dropFrom, dropSpan] = W.housePurchase.drop;
  const assets = housePurchase ? Math.round(dropFrom + rand() * dropSpan) : trueAssets;
  if (housePurchase) churn = rand() < W.housePurchase.churn ? 1 : 0;
  return { age, tenure, products, assets, contact, advisor, complaint, app, churn };
}

/**
 * Generates `n` clients. The first round(n × learnShare) belong to the learning cohort, the rest to the test
 * cohort. Rows come in order from the seeded stream, so a larger n keeps the same first clients.
 */
export function generate(n = DEFAULTS.data.n, seed = DEFAULTS.data.seed, learnShare = DEFAULTS.data.learnShare) {
  const nLearn = Math.round(n * learnShare);
  const rand = rng(seed);
  return Array.from({ length: n }, (_, i) => ({
    id: clientId("C", i, 3),
    cohort: i < nLearn ? COHORTS.learn : COHORTS.test,
    ...drawClient(rand),
  }));
}

/** New clients arriving after go-live (production cohort); their outcome is only known months later. */
export const newBatch = (n = DEFAULTS.batch.n, seed = DEFAULTS.batch.seed) =>
  generate(n, seed, 0).map((x, i) => ({
    ...x,
    id: clientId("N", i, 4),
    cohort: COHORTS.production,
  }));
