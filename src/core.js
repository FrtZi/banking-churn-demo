// Core: synthetic data + CART decision tree (no dependencies, runs offline).
const Core = (() => {
  // ---------- seeded random
  function rng(seed) {
    let a = seed >>> 0;
    const r = () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.norm = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
    r.pick = (items, weights) => {
      let x = r() * weights.reduce((s, w) => s + w, 0);
      for (let i = 0; i < items.length; i++) { x -= weights[i]; if (x <= 0) return items[i]; }
      return items[items.length - 1];
    };
    return r;
  }

  const APP = ["none", "dropping", "stable", "active"]; // ordered by engagement

  const FEATURES = [
    { key: "assets", label: "Assets change (12 m)", type: "num", unit: "%" },
    { key: "contact", label: "Months since last advisor contact", short: "Last contact", type: "num", unit: " months" },
    { key: "advisor", label: "Advisor changed this year", short: "Advisor changed", type: "bool" },
    { key: "complaint", label: "Complaint (last 3 m)", short: "Complaint", type: "bool" },
    { key: "app", label: "App usage", type: "ord", levels: APP },
    { key: "products", label: "Products held", short: "Products", type: "num", unit: "" },
    { key: "tenure", label: "Client since (years)", short: "Tenure", type: "num", unit: " yrs" },
    { key: "age", label: "Age", type: "num", unit: "" },
  ];

  // ---------- synthetic private-banking clients
  // n clients; the first round(n * learnShare) are 2024 (to learn from), the rest 2025 (kept to test).
  // Rows are drawn in order from the seeded stream, so a larger n keeps the same first clients.
  // The training default: every figure in the speaker notes assumes these settings.
  const DEFAULTS = { n: 500, seed: 101, learnShare: 0.8 };
  function generate(n = DEFAULTS.n, seed = DEFAULTS.seed, learnShare = DEFAULTS.learnShare) {
    const nLearn = Math.round(n * learnShare);
    const r = rng(seed);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const rows = [];
    for (let i = 0; i < n; i++) {
      const age = Math.round(clamp(28 + r() * 52 + r.norm() * 3, 25, 85));
      const tenure = Math.max(1, Math.round(r() * Math.min(35, age - 22)));
      const products = r.pick([1, 2, 3, 4, 5], [22, 30, 27, 14, 7]);
      const trueAssets = Math.round(clamp(3 + r.norm() * 13, -45, 40));
      const contact = Math.round(clamp(-Math.log(1 - r()) * 4.5, 0, 18));
      const advisor = r() < 0.14 ? 1 : 0;
      const complaint = r() < 0.1 ? 1 : 0;
      const appW = age > 65 ? [45, 15, 30, 10] : age > 45 ? [20, 15, 40, 25] : [8, 17, 35, 40];
      const app = r.pick(APP, appW);
      // hidden facts, NOT exported: they explain errors no model can avoid
      const competitorOffer = r() < 0.045;
      const housePurchase = r() < 0.05;

      let z = -4.3;
      if (trueAssets < -20) z += 2.6; else if (trueAssets < -8) z += 1.3;
      if (contact >= 10) z += 2.5; else if (contact >= 6) z += 1.5;
      if (advisor) z += 1.6;
      if (complaint) z += 2.4;
      if (app === "dropping") z += 1.5; else if (app === "none") z += 0.3; else if (app === "active") z -= 0.6;
      z -= 0.35 * (products - 1);
      z -= 0.01 * tenure;
      z += r.norm() * 0.3;
      let churn = r() < 1 / (1 + Math.exp(-z)) ? 1 : 0;
      if (competitorOffer && r() < 0.75) churn = 1;

      // a house purchase drains assets but the client stays: the data only sees the drop
      const assets = housePurchase ? Math.round(-28 - r() * 22) : trueAssets;
      if (housePurchase) churn = r() < 0.05 ? 1 : 0;

      rows.push({ id: `C${String(i + 1).padStart(3, "0")}`, cohort: i < nLearn ? 2024 : 2025,
        age, tenure, products, assets, contact, advisor, complaint, app, churn });
    }
    return rows;
  }

  // the 8 clients of the in-room game (same signals as the slides)
  const GAME = [
    { id: "A", name: "Marc, 58", age: 58, tenure: 22, products: 3, assets: -35, contact: 9, advisor: 1, complaint: 0, app: "none", churn: 1 },
    { id: "B", name: "Sophie, 41", age: 41, tenure: 6, products: 4, assets: 8, contact: 1, advisor: 0, complaint: 0, app: "active", churn: 0 },
    { id: "C", name: "Jean, 67", age: 67, tenure: 30, products: 3, assets: -40, contact: 0, advisor: 0, complaint: 0, app: "none", churn: 0 },
    { id: "D", name: "Laura, 35", age: 35, tenure: 2, products: 1, assets: 0, contact: 11, advisor: 0, complaint: 0, app: "dropping", churn: 1 },
    { id: "E", name: "Paul, 52", age: 52, tenure: 15, products: 3, assets: 2, contact: 3, advisor: 0, complaint: 0, app: "stable", churn: 1 },
    { id: "F", name: "Nadia, 46", age: 46, tenure: 9, products: 2, assets: -15, contact: 6, advisor: 0, complaint: 1, app: "stable", churn: 1 },
    { id: "G", name: "Thomas, 29", age: 29, tenure: 1, products: 1, assets: 20, contact: 4, advisor: 0, complaint: 0, app: "active", churn: 0 },
    { id: "H", name: "Elena, 73", age: 73, tenure: 25, products: 2, assets: -10, contact: 5, advisor: 0, complaint: 0, app: "none", churn: 0 },
  ];

  const value = (row, f) => (f.type === "ord" ? f.levels.indexOf(row[f.key]) : row[f.key]);

  // ---------- CART (Gini)
  const gini = (pos, n) => (n ? 1 - (pos / n) ** 2 - (1 - pos / n) ** 2 : 0);

  function bestSplit(rows, minLeaf) {
    const n = rows.length, pos = rows.reduce((s, r) => s + r.churn, 0);
    const parent = gini(pos, n);
    let best = null;
    for (const f of FEATURES) {
      const sorted = rows.map((r) => [value(r, f), r.churn]).sort((a, b) => a[0] - b[0]);
      let lp = 0;
      for (let i = 0; i < n - 1; i++) {
        lp += sorted[i][1];
        const ln = i + 1;
        if (sorted[i][0] === sorted[i + 1][0] || ln < minLeaf || n - ln < minLeaf) continue;
        const g = parent - (ln / n) * gini(lp, ln) - ((n - ln) / n) * gini(pos - lp, n - ln);
        if (!best || g > best.gain) best = { f, t: (sorted[i][0] + sorted[i + 1][0]) / 2, gain: g };
      }
    }
    return best;
  }

  function train(rows, maxDepth = 3, minLeaf = 12, depth = 0) {
    const n = rows.length, pos = rows.reduce((s, r) => s + r.churn, 0);
    const node = { n, pos, p: n ? pos / n : 0, depth };
    if (depth >= maxDepth || pos === 0 || pos === n) return node;
    const s = bestSplit(rows, minLeaf);
    if (!s || s.gain < 0.002) return node;
    node.f = s.f; node.t = s.t;
    node.yes = train(rows.filter((r) => value(r, s.f) <= s.t), maxDepth, minLeaf, depth + 1);
    node.no = train(rows.filter((r) => value(r, s.f) > s.t), maxDepth, minLeaf, depth + 1);
    return node;
  }

  function leafOf(node, row) {
    while (node.f) node = value(row, node.f) <= node.t ? node.yes : node.no;
    return node;
  }
  const predict = (tree, row) => leafOf(tree, row).p;

  function leaves(node, path = [], out = []) {
    if (!node.f) { out.push({ node, path }); return out; }
    leaves(node.yes, [...path, { f: node.f, t: node.t, yes: true }], out);
    leaves(node.no, [...path, { f: node.f, t: node.t, yes: false }], out);
    return out;
  }

  // ---------- plain-English conditions
  const fmtNum = (v, f) => `${v > 0 && f.unit === "%" ? "+" : ""}${v}${f.unit}`;
  function condition(f, t, yes) {
    const name = f.short || f.label;
    if (f.type === "bool") return `${name}: ${yes ? "no" : "yes"}`;
    if (f.type === "ord") {
      const k = Math.floor(t);
      const set = yes ? f.levels.slice(0, k + 1) : f.levels.slice(k + 1);
      return `${f.label}: ${set.join(" or ")}`;
    }
    // integer data: "x <= t" means x <= floor(t), so the other branch starts at floor(t) + 1
    const lo = Math.floor(t), hi = Math.floor(t) + 1;
    return yes ? `${name} ≤ ${fmtNum(lo, f)}` : `${name} ≥ ${fmtNum(hi, f)}`;
  }
  // short label on a tree edge: yes = "value <= t" branch
  function edgeLabel(f, t, yes) {
    if (f.type === "bool") return yes ? "no" : "yes";
    if (f.type === "ord") {
      const k = Math.floor(t);
      return (yes ? f.levels.slice(0, k + 1) : f.levels.slice(k + 1)).join(" / ");
    }
    return yes ? `≤ ${fmtNum(Math.floor(t), f)}` : `≥ ${fmtNum(Math.floor(t) + 1, f)}`;
  }
  const nodeLabel = (f) => f.short || f.label;

  // merge conditions on the same feature into a single readable range
  function ruleText(path) {
    const byF = new Map();
    for (const c of path) {
      const e = byF.get(c.f.key) || { f: c.f, lo: -Infinity, hi: Infinity };
      if (c.yes) e.hi = Math.min(e.hi, c.t); else e.lo = Math.max(e.lo, c.t);
      byF.set(c.f.key, e);
    }
    return [...byF.values()].map(({ f, lo, hi }) => {
      if (f.type === "bool" || f.type === "ord") {
        if (f.type === "bool") return condition(f, 0.5, hi < Infinity);
        const from = lo === -Infinity ? 0 : Math.floor(lo) + 1;
        const to = hi === Infinity ? f.levels.length - 1 : Math.floor(hi);
        return `${f.label}: ${f.levels.slice(from, to + 1).join(" or ")}`;
      }
      if (lo > -Infinity && hi < Infinity) return `${f.short || f.label} between ${fmtNum(Math.floor(lo) + 1, f)} and ${fmtNum(Math.floor(hi), f)}`;
      return condition(f, lo > -Infinity ? lo : hi, hi < Infinity);
    });
  }

  function evaluate(tree, rows, threshold) {
    const m = { tp: 0, fp: 0, fn: 0, tn: 0 };
    for (const r of rows) {
      const flag = predict(tree, r) >= threshold;
      if (flag && r.churn) m.tp++; else if (flag) m.fp++; else if (r.churn) m.fn++; else m.tn++;
    }
    return m;
  }

  // ---------- hand-written rules ("the room's rules")
  // A condition is { key, op, value } with op: "le" (<=), "ge" (>=), "is" (===) or "in" (one of value[]).
  // A rule is a list of conditions joined by AND; a client is called if ANY rule matches (OR).
  function matches(cond, row) {
    const v = row[cond.key];
    if (cond.op === "le") return v <= cond.value;
    if (cond.op === "ge") return v >= cond.value;
    if (cond.op === "is") return v === cond.value;
    if (cond.op === "in") return cond.value.includes(v);
    throw new Error(`unknown operator ${cond.op}`);
  }
  const ruleFlags = (rules, row) => rules.some((rule) => rule.length > 0 && rule.every((c) => matches(c, row)));
  function evaluateRules(rules, rows) {
    const m = { tp: 0, fp: 0, fn: 0, tn: 0 };
    for (const r of rows) {
      const flag = ruleFlags(rules, r);
      if (flag && r.churn) m.tp++; else if (flag) m.fp++; else if (r.churn) m.fn++; else m.tn++;
    }
    return m;
  }

  // typical rules proposed by a room after the game (used by the "Load an example" button)
  const ROOM_EXAMPLE = [
    [{ key: "assets", op: "le", value: -20 }, { key: "contact", op: "ge", value: 6 }],
    [{ key: "complaint", op: "is", value: 1 }],
    [{ key: "advisor", op: "is", value: 1 }, { key: "contact", op: "ge", value: 6 }],
  ];

  // ROC curve on scored rows: one point per distinct risk level, from "call nobody" to "call everybody".
  // Each point is the threshold t = that risk level (clients with risk >= t are called).
  function roc(tree, rows) {
    const scored = rows.map((r) => ({ p: predict(tree, r), y: r.churn }));
    const pos = scored.filter((s) => s.y).length, neg = scored.length - pos;
    const levels = [...new Set(scored.map((s) => s.p))].sort((a, b) => b - a);
    const points = [{ t: Infinity, tpr: 0, fpr: 0, tp: 0, fp: 0, fn: pos, tn: neg }];
    for (const t of levels) {
      const tp = scored.filter((s) => s.p >= t && s.y).length;
      const fp = scored.filter((s) => s.p >= t && !s.y).length;
      points.push({ t, tpr: pos ? tp / pos : 0, fpr: neg ? fp / neg : 0, tp, fp, fn: pos - tp, tn: neg - fp });
    }
    return points;
  }
  // area under the (piecewise-linear) ROC curve
  const auc = (points) => points.slice(1).reduce((s, q, i) => s + (q.fpr - points[i].fpr) * (q.tpr + points[i].tpr) / 2, 0);

  // ranking score = area under the ROC curve of a tree on some rows (0.5 = coin flip, 1 = perfect)
  const score = (tree, rows) => auc(roc(tree, rows));

  // k-fold cross-validation on the training clients only: hide 1/k, learn on the rest, score on the
  // hidden part, k times. Folds are fixed (row i goes to fold i % k) so the demo is reproducible.
  function crossValidate(rows, maxDepth, minLeaf, k = 5) {
    const folds = [];
    for (let f = 0; f < k; f++) {
      const hidden = rows.filter((_, i) => i % k === f);
      const learn = rows.filter((_, i) => i % k !== f);
      folds.push(score(train(learn, maxDepth, minLeaf), hidden));
    }
    return { mean: folds.reduce((x, y) => x + y, 0) / k, folds };
  }

  // score on the learned clients vs on hidden clients, for every depth; best = highest hidden score
  // (ties go to the simpler tree)
  function depthSearch(rows, minLeaf, maxDepth = 8) {
    const curve = [];
    for (let d = 1; d <= maxDepth; d++) {
      curve.push({ depth: d, learned: score(train(rows, d, minLeaf), rows), hidden: crossValidate(rows, d, minLeaf).mean });
    }
    const best = curve.reduce((b, c) => (c.hidden > b.hidden + 1e-9 ? c : b));
    return { curve, best: best.depth };
  }

  // ---------- data quality
  // Problems in the historical data the model learns from (applied to the 2024 clients only;
  // the 2025 test clients stay clean so the results step shows the true impact).
  // Each issue has one parameter (param.def is the default); `issues` maps an issue key to its value,
  // or is an array of keys to use the defaults.
  const TRAINING_ISSUES = {
    missingContact: { label: "Missing last-contact dates, filled with 0 by the system",
      param: { name: "clients affected", min: 5, max: 90, step: 5, def: 30, unit: "%" },
      apply: (rows, r, v) => rows.map((x) => (r() < v / 100 ? { ...x, contact: 0 } : x)) },
    complaintsLost: { label: "Complaints not logged for part of the year",
      param: { name: "complaints lost", min: 10, max: 100, step: 10, def: 60, unit: "%" },
      apply: (rows, r, v) => rows.map((x) => (x.complaint && r() < v / 100 ? { ...x, complaint: 0 } : x)) },
    labelNoise: { label: "Wrong outcome: account closures recorded as \"stayed\"",
      param: { name: "leavers mislabelled", min: 5, max: 90, step: 5, def: 35, unit: "%" },
      apply: (rows, r, v) => rows.map((x) => (x.churn && r() < v / 100 ? { ...x, churn: 0 } : x)) },
    sampleBias: { label: "Biased sample: history only kept for younger clients",
      param: { name: "kept if under", min: 30, max: 75, step: 5, def: 50, unit: " years" },
      apply: (rows, r, v) => rows.filter((x) => x.age < v) },
  };
  const asParams = (issues, catalog) => Array.isArray(issues)
    ? Object.fromEntries(issues.map((k) => [k, catalog[k].param.def])) : issues;
  function degradeTraining(rows, issues, seed = 7) {
    const r = rng(seed), on = asParams(issues, TRAINING_ISSUES);
    return Object.keys(TRAINING_ISSUES).reduce((out, k) => (k in on ? TRAINING_ISSUES[k].apply(out, r, on[k]) : out), rows);
  }

  // Problems in the data flowing into a model already in production; the parameter is the share of
  // new clients hit (100% = the whole feed is broken, less = a partial outage, harder to spot).
  const share = { name: "new clients affected", min: 10, max: 100, step: 10, def: 100, unit: "%" };
  const INFERENCE_ISSUES = {
    complaintsStop: { label: "Complaint feed broken: complaints no longer arrive", param: share,
      apply: (x) => ({ ...x, complaint: 0 }) },
    contactZero: { label: "CRM migration: last-contact date defaults to 0", param: share,
      apply: (x) => ({ ...x, contact: 0 }) },
    appBroken: { label: "App tracking stopped: clients show \"none\"", param: share,
      apply: (x) => ({ ...x, app: "none" }) },
    assetsRatio: { label: "Format change: assets delivered as a ratio (-0.2) instead of % (-20)", param: share,
      apply: (x) => ({ ...x, assets: Math.round(x.assets) / 100 }) },
  };
  function degradeBatch(rows, issues, seed = 11) {
    const r = rng(seed), on = asParams(issues, INFERENCE_ISSUES);
    return rows.map((x) => Object.keys(INFERENCE_ISSUES).reduce((y, k) => {
      const hit = r() < (on[k] ?? 0) / 100; // one draw per client and issue, so results are reproducible
      return k in on && hit ? INFERENCE_ISSUES[k].apply(y) : y;
    }, x));
  }

  // a batch of new clients arriving after go-live (their outcome is only known months later)
  const newBatch = (n = 1000, seed = 2026) =>
    generate(n, seed, 0).map((x, i) => ({ ...x, id: `N${String(i + 1).padStart(4, "0")}`, cohort: 2026 }));

  // Population Stability Index: how much a signal's distribution moved between the data the model
  // learned from (ref) and new data (cur). Usual reading: < 0.10 stable, 0.10-0.25 watch, > 0.25 alert.
  function psi(ref, cur, f) {
    let bucket;
    if (f.type === "num") {
      const v = ref.map((x) => x[f.key]).sort((a, b) => a - b);
      const edges = [...new Set([0.2, 0.4, 0.6, 0.8].map((q) => v[Math.floor(q * (v.length - 1))]))];
      bucket = (x) => edges.filter((e) => x[f.key] > e).length;
    } else bucket = (x) => String(x[f.key]);
    const share = (rows) => rows.reduce((m, x) => m.set(bucket(x), (m.get(bucket(x)) || 0) + 1 / rows.length), new Map());
    const a = share(ref), b = share(cur), eps = 1e-4;
    return [...new Set([...a.keys(), ...b.keys()])].reduce((s, k) => {
      const p = Math.max(a.get(k) || 0, eps), q = Math.max(b.get(k) || 0, eps);
      return s + (q - p) * Math.log(q / p);
    }, 0);
  }

  return { DEFAULTS, TRAINING_ISSUES, degradeTraining, INFERENCE_ISSUES, degradeBatch, newBatch, psi, score, crossValidate, depthSearch, matches, evaluateRules, ROOM_EXAMPLE, roc, auc, rng, generate, GAME, FEATURES, train, predict, leaves, ruleText, evaluate, edgeLabel, nodeLabel, APP };
})();
if (typeof module !== "undefined") module.exports = Core;
