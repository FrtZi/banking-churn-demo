import assert from "node:assert/strict";
import test from "node:test";
import * as Engine from "../src/engine/index.js";

/** Ticked issues at their default parameter: { key: param.def }. */
const withDefaults = (catalog, ...keys) => Object.fromEntries(keys.map((k) => [k, catalog[k].param.def]));
const training = (...keys) => withDefaults(Engine.TRAINING_ISSUES, ...keys);
const production = (...keys) => withDefaults(Engine.INFERENCE_ISSUES, ...keys);

const data = Engine.generate();
const train = data.filter((r) => r.cohort === 2024);
const test2025 = data.filter((r) => r.cohort === 2025);
const tree = Engine.train(train, 3);

test("data is deterministic and split 400 / 100", () => {
  assert.deepEqual(Engine.generate(), data);
  assert.equal(data.length, 500);
  assert.equal(train.length, 400);
  assert.equal(test2025.length, 100);
});

test("churn rate is realistic for a teaching dataset", () => {
  const rate = data.reduce((s, r) => s + r.churn, 0) / data.length;
  assert.ok(rate > 0.05 && rate < 0.2, `churn rate ${rate}`);
});

test("hidden facts never reach the exported data", () => {
  const keys = [
    "id",
    "cohort",
    "age",
    "tenure",
    "products",
    "assets",
    "contact",
    "advisor",
    "complaint",
    "app",
    "churn",
  ];
  for (const row of data) assert.deepEqual(Object.keys(row), keys);
});

test("tree respects the depth limit and predicts probabilities", () => {
  for (const depth of [1, 2, 3, 4, 5]) {
    const t = Engine.train(train, depth);
    const leaves = Engine.leaves(t);
    assert.ok(leaves.length >= 2);
    for (const { path } of leaves) assert.ok(path.length <= depth);
  }
  for (const row of test2025) {
    const p = Engine.predict(tree, row);
    assert.ok(p >= 0 && p <= 1);
  }
});

test("confusion matrix covers every test client", () => {
  const m = Engine.evaluate(tree, test2025, 0.3);
  assert.equal(m.tp + m.fp + m.fn + m.tn, test2025.length);
});

test("rules read as plain English", () => {
  for (const { path } of Engine.leaves(Engine.train(train, 5))) {
    const text = Engine.ruleText(path).join(" AND ");
    assert.doesNotMatch(text, /undefined|Infinity|NaN/);
  }
});

test("the storyline of the in-room game holds at the default settings", () => {
  const risk = Object.fromEntries(Engine.GAME.map((c) => [c.id, Engine.predict(tree, c)]));
  assert.ok(risk.A >= 0.3, "Marc (A) is caught");
  assert.ok(risk.F >= 0.3, "Nadia (F) is caught");
  assert.ok(risk.E < 0.3, "Paul (E) is missed: his reason is invisible in the data");
  assert.ok(risk.C < 0.3, "Jean (C) is left alone");
});

test("the two branches of a numeric split never overlap", () => {
  const assets = Engine.featureByKey("assets");
  for (const t of [2, 1.5, -19.5, -20]) {
    const yes = Engine.edgeLabel(assets, t, true).match(/-?\+?\d+/)[0];
    const no = Engine.edgeLabel(assets, t, false).match(/-?\+?\d+/)[0];
    assert.equal(Number(no), Number(yes) + 1, `t=${t}: ${yes} / ${no}`);
  }
});

test("ROC curve runs from (0,0) to (1,1) and is monotone", () => {
  const pts = Engine.roc(tree, test2025);
  assert.deepEqual([pts[0].fpr, pts[0].tpr], [0, 0]);
  assert.deepEqual([pts.at(-1).fpr, pts.at(-1).tpr], [1, 1]);
  for (let i = 1; i < pts.length; i++) {
    assert.ok(pts[i].fpr >= pts[i - 1].fpr && pts[i].tpr >= pts[i - 1].tpr);
    assert.equal(pts[i].tp + pts[i].fn + pts[i].fp + pts[i].tn, test2025.length);
  }
});

test("each ROC point matches the confusion matrix at its threshold", () => {
  for (const pt of Engine.roc(tree, test2025).slice(1)) {
    const m = Engine.evaluate(tree, test2025, pt.t);
    assert.deepEqual([m.tp, m.fp, m.fn, m.tn], [pt.tp, pt.fp, pt.fn, pt.tn]);
  }
});

test("the model beats random guessing (AUC)", () => {
  const a = Engine.auc(Engine.roc(tree, test2025));
  assert.ok(a > 0.6 && a <= 1, `AUC ${a}`);
});

test("hand-written rules: AND inside a rule, OR between rules", () => {
  const row = { assets: -25, contact: 7, complaint: 0, advisor: 0, app: "dropping" };
  assert.equal(Engine.matches({ key: "assets", op: "le", value: -20 }, row), true);
  assert.equal(Engine.matches({ key: "contact", op: "ge", value: 8 }, row), false);
  assert.equal(Engine.matches({ key: "app", op: "in", value: ["none", "dropping"] }, row), true);
  const one = [{ key: "complaint", op: "is", value: 1 }];
  const two = [
    { key: "assets", op: "le", value: -20 },
    { key: "contact", op: "ge", value: 6 },
  ];
  assert.equal(Engine.evaluateRules([one], [{ ...row, churn: 1 }]).fn, 1);
  assert.equal(Engine.evaluateRules([one, two], [{ ...row, churn: 1 }]).tp, 1);
});

test("no rule means nobody is called", () => {
  const m = Engine.evaluateRules([[], [], []], test2025);
  assert.equal(m.tp + m.fp, 0);
});

test("the example room rules tell the story used in the training", () => {
  const m = Engine.evaluateRules(Engine.ROOM_EXAMPLE, test2025);
  assert.deepEqual([m.tp + m.fp, m.tp, m.fp], [21, 8, 13]);
  const intuitive = Engine.evaluateRules([[{ key: "assets", op: "le", value: -20 }]], test2025);
  assert.ok(intuitive.tp <= 1, "assets down alone is mostly noise (house purchases)");
});

test("cross-validation is reproducible and never uses the 2025 test clients", () => {
  const a = Engine.crossValidate(train, 3, 12),
    b = Engine.crossValidate(train, 3, 12);
  assert.deepEqual(a, b);
  assert.equal(a.folds.length, 5);
});

test("depth search: learned score keeps rising, hidden score peaks at 3 questions (3% minimum group)", () => {
  const { curve, best } = Engine.depthSearch(train, 12);
  assert.equal(best, 3);
  assert.ok(curve.at(-1).learned > curve[0].learned);
  assert.ok(curve.at(-1).hidden < curve[best - 1].hidden, "going deeper hurts on hidden clients");
});

test("tiny groups make overfitting obvious: big gap between learned and hidden clients", () => {
  const deep = Engine.depthSearch(train, 2).curve.at(-1);
  assert.ok(deep.learned - deep.hidden > 0.2, `gap ${deep.learned - deep.hidden}`);
});

test("inference panel clients: same risk with a sensible tree, opposite certainties when overfitted", () => {
  const good = Engine.train(train, 3, 12),
    over = Engine.train(train, 8, 2);
  const c = (id) => test2025.find((r) => r.id === id);
  assert.ok(
    ["C422", "C401", "C480"].every((id) => c(id)),
    "picked clients belong to the unseen 2025 set",
  );
  assert.equal(Engine.predict(good, c("C422")), Engine.predict(good, c("C401")));
  assert.deepEqual([Engine.predict(over, c("C422")), Engine.predict(over, c("C401"))], [0, 1]);
  assert.ok(!Engine.GAME.some((g) => ["C422", "C401", "C480"].includes(g.id)), "no overlap with the game's 8 clients");
});

test("data size, seed and learn/test split are parameters; defaults are unchanged", () => {
  assert.deepEqual(Engine.generate(500, 101, 0.8), data);
  const big = Engine.generate(1000, 101, 0.7);
  assert.equal(big.filter((r) => r.cohort === 2024).length, 700);
  assert.deepEqual(
    big.slice(0, 500).map((r) => ({ ...r, cohort: 0 })),
    data.map((r) => ({ ...r, cohort: 0 })),
    "a larger sample keeps the same first clients",
  );
  assert.notDeepEqual(Engine.generate(500, 202), data, "another seed gives another sample");
});

test("training data-quality issues are reproducible and do what they say", () => {
  assert.deepEqual(Engine.degradeTraining(train, {}), train);
  assert.deepEqual(
    Engine.degradeTraining(train, training("labelNoise")),
    Engine.degradeTraining(train, training("labelNoise")),
  );
  const leavers = (rows) => rows.filter((r) => r.churn).length;
  assert.ok(leavers(Engine.degradeTraining(train, training("labelNoise"))) < leavers(train));
  assert.ok(Engine.degradeTraining(train, training("sampleBias")).every((r) => r.age < 50));
  const lost = Engine.degradeTraining(train, training("complaintsLost")).filter((r) => r.complaint).length;
  assert.ok(lost < train.filter((r) => r.complaint).length);
});

test("drift monitor: clean batch is stable, each broken feed raises an alert on its own signal", () => {
  const batch = Engine.newBatch();
  const feature = (k) => Engine.featureByKey(k);
  for (const f of Engine.FEATURES) assert.ok(Engine.psi(train, batch, f) < 0.1, `${f.key} stable on clean data`);
  const expected = { complaintsStop: "complaint", contactZero: "contact", appBroken: "app", assetsRatio: "assets" };
  for (const [issue, key] of Object.entries(expected)) {
    assert.ok(
      Engine.psi(train, Engine.degradeBatch(batch, production(issue)), feature(key)) > 0.25,
      `${issue} -> ${key}`,
    );
  }
});

test("a broken complaint feed silently hurts the model in production", () => {
  const model = Engine.train(train, 3, 12),
    batch = Engine.newBatch();
  const clean = Engine.evaluate(model, batch, 0.3),
    broken = Engine.evaluate(model, Engine.degradeBatch(batch, production("complaintsStop")), 0.3);
  assert.ok(broken.tp < clean.tp / 2, `${broken.tp} vs ${clean.tp}`);
});

test("data-quality parameters: higher values do more damage", () => {
  const leavers = Engine.countLeavers;
  assert.ok(
    leavers(Engine.degradeTraining(train, { labelNoise: 80 })) <
      leavers(Engine.degradeTraining(train, { labelNoise: 20 })),
  );
  assert.ok(Engine.degradeTraining(train, { sampleBias: 40 }).every((r) => r.age < 40));
  const batch = Engine.newBatch();
  const hit = (v) =>
    Engine.degradeBatch(batch, { appBroken: v }).filter((r, i) => r.app === "none" && batch[i].app !== "none").length;
  assert.ok(hit(30) > 0 && hit(30) < hit(100));
  const complaint = Engine.featureByKey("complaint");
  assert.ok(
    Engine.psi(train, Engine.degradeBatch(batch, { complaintsStop: 30 }), complaint) <
      Engine.psi(train, Engine.degradeBatch(batch, { complaintsStop: 100 }), complaint),
    "a partial outage drifts less",
  );
});

test("the training default lives in one place", () => {
  assert.deepEqual(Engine.DEFAULTS.data, { n: 500, seed: 101, learnShare: 0.8 });
  assert.deepEqual(
    Engine.generate(),
    Engine.generate(Engine.DEFAULTS.data.n, Engine.DEFAULTS.data.seed, Engine.DEFAULTS.data.learnShare),
  );
});

test("signals: one lookup, one short name, one value format", () => {
  const contact = Engine.featureByKey("contact");
  const assets = Engine.featureByKey("assets");
  assert.equal(Engine.featureByKey("unknown"), undefined);
  assert.equal(Engine.shortName(contact), "Last contact");
  assert.equal(Engine.shortName(assets), assets.label); // no short name: the label
  assert.equal(Engine.formatValue(6, contact), "6 months");
  assert.equal(Engine.formatValue(8, assets), "+8%"); // changes carry their sign
  assert.equal(Engine.formatValue(-20, assets), "-20%");
  assert.equal(Engine.countLeavers(data), data.filter((r) => r.churn).length);
});
