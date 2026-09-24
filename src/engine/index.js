/**
 * Public API of the engine: synthetic data, a CART decision tree, evaluation, cross-validation, hand-written
 * rules, data-quality issues and drift. Pure functions, no DOM: used by the page and by the Node tests.
 */
export { COHORTS, DEFAULTS } from "./config.js";
export { FEATURES, featureByKey } from "./features.js";
export { GAME, ROOM_EXAMPLE } from "./game.js";
export { generate, newBatch } from "./generate.js";
export { train, predict, leaves, countLeavers } from "./tree.js";
export { edgeLabel, formatValue, ruleText, shortName } from "./labels.js";
export { evaluate, roc, auc, score } from "./evaluation.js";
export { matches, evaluateRules } from "./rules.js";
export { crossValidate, depthSearch } from "./validation.js";
export { TRAINING_ISSUES, INFERENCE_ISSUES, degradeTraining, degradeBatch } from "./quality.js";
export { psi } from "./drift.js";
