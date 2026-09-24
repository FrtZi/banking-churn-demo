/**
 * The synthetic world: how the signals are drawn and how they drive churn (a logistic score).
 * Two facts are drawn but never exported (competitor offer, house purchase): no model can see them.
 */
export const WORLD = {
  age: { min: 25, max: 85, from: 28, span: 52, noise: 3 },
  tenure: { careerStart: 22, max: 35 },
  products: { values: [1, 2, 3, 4, 5], weights: [22, 30, 27, 14, 7] },
  assets: { mean: 3, sd: 13, min: -45, max: 40 },
  contact: { meanMonths: 4.5, max: 18 },
  advisorChange: 0.14,
  complaint: 0.1,
  appWeights: { over65: [45, 15, 30, 10], over45: [20, 15, 40, 25], younger: [8, 17, 35, 40] },
  competitorOffer: { rate: 0.045, churn: 0.75 },
  housePurchase: { rate: 0.05, drop: [-28, -22], churn: 0.05 },
  churn: {
    base: -4.3,
    // [threshold, weight] pairs, first match wins: assets below the threshold, contact at least the threshold
    assets: [
      [-20, 2.6],
      [-8, 1.3],
    ],
    contact: [
      [10, 2.5],
      [6, 1.5],
    ],
    advisor: 1.6,
    complaint: 2.4,
    app: { dropping: 1.5, none: 0.3, active: -0.6 },
    perExtraProduct: -0.35,
    perTenureYear: -0.01,
    noise: 0.3,
  },
};
