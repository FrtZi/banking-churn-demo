const test = require("node:test");
const assert = require("node:assert/strict");
const Core = require("../src/core.js");

const data = Core.generate();
const train = data.filter((r) => r.cohort === 2024);
const test2025 = data.filter((r) => r.cohort === 2025);
const tree = Core.train(train, 3);

test("data is deterministic and split 400 / 100", () => {
  assert.deepEqual(Core.generate(), data);
  assert.equal(data.length, 500);
  assert.equal(train.length, 400);
  assert.equal(test2025.length, 100);
});

test("churn rate is realistic for a teaching dataset", () => {
  const rate = data.reduce((s, r) => s + r.churn, 0) / data.length;
  assert.ok(rate > 0.05 && rate < 0.2, `churn rate ${rate}`);
});

test("hidden facts never reach the exported data", () => {
  const keys = ["id", "cohort", "age", "tenure", "products", "assets", "contact", "advisor", "complaint", "app", "churn"];
  for (const row of data) assert.deepEqual(Object.keys(row), keys);
});

test("tree respects the depth limit and predicts probabilities", () => {
  for (const depth of [1, 2, 3, 4, 5]) {
    const t = Core.train(train, depth);
    const leaves = Core.leaves(t);
    assert.ok(leaves.length >= 2);
    for (const { path } of leaves) assert.ok(path.length <= depth);
  }
  for (const row of test2025) {
    const p = Core.predict(tree, row);
    assert.ok(p >= 0 && p <= 1);
  }
});

test("confusion matrix covers every test client", () => {
  const m = Core.evaluate(tree, test2025, 0.3);
  assert.equal(m.tp + m.fp + m.fn + m.tn, test2025.length);
});

test("rules read as plain English", () => {
  for (const { path } of Core.leaves(Core.train(train, 5))) {
    const text = Core.ruleText(path).join(" AND ");
    assert.doesNotMatch(text, /undefined|Infinity|NaN/);
  }
});

test("the storyline of the in-room game holds at the default settings", () => {
  const risk = Object.fromEntries(Core.GAME.map((c) => [c.id, Core.predict(tree, c)]));
  assert.ok(risk.A >= 0.3, "Marc (A) is caught");
  assert.ok(risk.F >= 0.3, "Nadia (F) is caught");
  assert.ok(risk.E < 0.3, "Paul (E) is missed: his reason is invisible in the data");
  assert.ok(risk.C < 0.3, "Jean (C) is left alone");
});

test("the two branches of a numeric split never overlap", () => {
  const assets = Core.FEATURES.find((f) => f.key === "assets");
  for (const t of [2, 1.5, -19.5, -20]) {
    const yes = Core.edgeLabel(assets, t, true).match(/-?\+?\d+/)[0];
    const no = Core.edgeLabel(assets, t, false).match(/-?\+?\d+/)[0];
    assert.equal(Number(no), Number(yes) + 1, `t=${t}: ${yes} / ${no}`);
  }
});

test("ROC curve runs from (0,0) to (1,1) and is monotone", () => {
  const pts = Core.roc(tree, test2025);
  assert.deepEqual([pts[0].fpr, pts[0].tpr], [0, 0]);
  assert.deepEqual([pts.at(-1).fpr, pts.at(-1).tpr], [1, 1]);
  for (let i = 1; i < pts.length; i++) {
    assert.ok(pts[i].fpr >= pts[i - 1].fpr && pts[i].tpr >= pts[i - 1].tpr);
    assert.equal(pts[i].tp + pts[i].fn + pts[i].fp + pts[i].tn, test2025.length);
  }
});

test("each ROC point matches the confusion matrix at its threshold", () => {
  for (const pt of Core.roc(tree, test2025).slice(1)) {
    const m = Core.evaluate(tree, test2025, pt.t);
    assert.deepEqual([m.tp, m.fp, m.fn, m.tn], [pt.tp, pt.fp, pt.fn, pt.tn]);
  }
});

test("the model beats random guessing (AUC)", () => {
  const a = Core.auc(Core.roc(tree, test2025));
  assert.ok(a > 0.6 && a <= 1, `AUC ${a}`);
});

test("hand-written rules: AND inside a rule, OR between rules", () => {
  const row = { assets: -25, contact: 7, complaint: 0, advisor: 0, app: "dropping" };
  assert.equal(Core.matches({ key: "assets", op: "le", value: -20 }, row), true);
  assert.equal(Core.matches({ key: "contact", op: "ge", value: 8 }, row), false);
  assert.equal(Core.matches({ key: "app", op: "in", value: ["none", "dropping"] }, row), true);
  const one = [{ key: "complaint", op: "is", value: 1 }];
  const two = [{ key: "assets", op: "le", value: -20 }, { key: "contact", op: "ge", value: 6 }];
  assert.equal(Core.evaluateRules([one], [{ ...row, churn: 1 }]).fn, 1);
  assert.equal(Core.evaluateRules([one, two], [{ ...row, churn: 1 }]).tp, 1);
});

test("no rule means nobody is called", () => {
  const m = Core.evaluateRules([[], [], []], test2025);
  assert.equal(m.tp + m.fp, 0);
});

test("the example room rules tell the story used in the training", () => {
  const m = Core.evaluateRules(Core.ROOM_EXAMPLE, test2025);
  assert.deepEqual([m.tp + m.fp, m.tp, m.fp], [21, 8, 13]);
  const intuitive = Core.evaluateRules([[{ key: "assets", op: "le", value: -20 }]], test2025);
  assert.ok(intuitive.tp <= 1, "assets down alone is mostly noise (house purchases)");
});
