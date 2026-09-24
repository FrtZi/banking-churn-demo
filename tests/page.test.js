// End-to-end check of the built page: drives it like the presenter does and asserts every figure quoted in
// the speaker notes. Run `npm run build` first (npm test does it).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const PAGE = new URL("../dist/index.html", import.meta.url);

function openPage() {
  const dom = new JSDOM(readFileSync(PAGE, "utf8"), {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "https://example.test/",
    beforeParse(window) {
      // reduced motion: the depth search runs instantly instead of animating
      window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
      window.scrollTo = () => {};
    },
  });
  const { window } = dom;
  const $ = (id) => window.document.getElementById(id);
  const text = (id) => $(id).textContent.replace(/\s+/g, " ").trim();
  const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
  const set = (id, value, type = "input") => {
    $(id).value = String(value);
    fire($(id), type);
  };
  const tick = (id, on = true) => {
    $(id).checked = on;
    fire($(id), "change");
  };
  const click = (id) => $(id).click();
  // table rows as "cell cell cell" strings
  const rows = (id) =>
    [...$(id).querySelectorAll("tr")].map((r) => [...r.cells].map((c) => c.textContent.trim()).join(" "));
  return { window, $, text, set, tick, click, rows };
}

test("step 1: training default data", () => {
  const { text } = openPage();
  assert.equal(text("k-n"), "500");
  assert.equal(text("k-train"), "400");
  assert.equal(text("k-test"), "100");
  assert.equal(text("k-rate"), "11%");
  assert.match(text("gen-note"), /Training default/);
});

test("step 5: results at the default 30% threshold", () => {
  const { text } = openPage();
  assert.deepEqual(["m-tp", "m-fp", "m-fn", "m-tn"].map(text), ["7", "8", "3", "82"]);
  assert.equal(text("r-calls"), "15");
  assert.equal(text("r-acc"), "89%");
  assert.equal(text("r-sens"), "70%");
  assert.equal(text("r-spec"), "91%");
  assert.equal(text("r-net"), "▲ €22,950 / yr");
  assert.match(text("roc-desc"), /87%/);
  assert.match(text("roc-desc"), /\(33%\)/);
  assert.match(text("roc-desc"), /at 12%/);
});

test("step 5: elbow and best-€ buttons, call cost moves the optimum", () => {
  const { $, text, set, click } = openPage();
  click("pick-value");
  assert.equal($("thr").value, "12");
  assert.equal(text("r-calls"), "40");
  assert.equal(text("r-net"), "▲ €26,400 / yr");
  click("pick-elbow");
  assert.equal($("thr").value, "33");
  set("v-call", 600);
  assert.match(text("roc-desc"), /at 33%/);
});

test("steps 2 and 4: the room's example rules against the machine", () => {
  const { text, click, rows } = openPage();
  assert.match(text("room-vs"), /No rule entered/);
  click("room-example");
  const vs = rows("room-vs");
  assert.ok(vs.includes("Calls 21 15"), vs.join(" | "));
  assert.ok(vs.includes("Leavers caught 8 / 10 7 / 10"));
  assert.ok(vs.includes("False alarms 13 8"));
  // the room's rules read with the tree's names
  assert.match(text("room-summary"), /Assets change \(12 m\) ≤ -20% AND Last contact ≥ 6 months/);
  assert.match(text("room-summary"), /Complaint \(last 3 m\): yes/);
});

test("steps 1 and 2: the tables and the rule builder list every signal once", () => {
  const { $, rows } = openPage();
  const signals = 8;
  const header = rows("t-data")[0];
  assert.equal($("t-data").rows[0].cells.length, signals + 2, header); // client, signals, outcome
  assert.match(header, /Last contact \(months\)/); // the unit word once, in the header
  assert.match(rows("t-data")[1], /^C001 [+-]?\d+% \d+ (yes|no) /); // "+8%", then a bare number of months
  assert.equal($("t-signals").rows.length, signals);
  assert.ok(rows("t-signals").includes("Last contact 0 to 18 months"), rows("t-signals").join(" | "));
  assert.equal($("r0c0-key").options.length, signals + 1); // "—" + every signal
});

test("step 3: automatic depth search and overfitting in the predictions", () => {
  const { $, text, set, click } = openPage();
  const risks = () => [...$("inference").querySelectorAll("b")].map((b) => b.textContent);
  assert.deepEqual(risks(), ["58%", "58%", "38%"]);
  set("minpct", 0);
  set("depth", 8);
  assert.deepEqual(risks(), ["0%", "100%", "0%"]);
  assert.match(text("certainty"), /35 of 100/);
  set("minpct", 3);
  click("search");
  assert.equal($("depth").value, "3");
  assert.match(text("vc-desc"), /Best level: 3 questions/);
});

test("step 6: the 8 game clients", () => {
  const { text, click } = openPage();
  click("reveal");
  assert.match(text("g-summary"), /6 of 8/);
});

test("step 7: drift monitor, full and partial outage", () => {
  const { text, set, tick, rows } = openPage();
  const psiRow = (name) => rows("t-psi").find((r) => r.startsWith(name));
  assert.match(psiRow("Complaint"), /0\.00 .*Stable/);
  tick("prod-complaintsStop");
  assert.match(psiRow("Complaint"), /0\.64 .*Alert/);
  assert.match(text("mon-now"), /34 \(clean data: 99\)/);
  assert.match(text("mon-later"), /10 \/ 106/);
  set("prod-complaintsStop-v", 30);
  assert.match(psiRow("Complaint"), /0\.01 .*Stable/);
  assert.match(text("mon-later"), /29 \/ 106/);
});

test("glossary: technical terms link to the Google ML Glossary", () => {
  const { window } = openPage();
  const links = [...window.document.querySelectorAll("a.term")];
  assert.ok(links.length >= 20);
  for (const a of links) {
    assert.match(a.href, /^https:\/\/developers\.google\.com\/machine-learning\/glossary#[a-z0-9-]+$/);
    assert.equal(a.target, "_blank");
    assert.equal(a.rel, "noopener");
  }
});

test("tiny data where nobody reaches the lowest threshold: the page keeps working", () => {
  const { $, text, set } = openPage();
  set("gen-n", 100, "change");
  set("depth", 2);
  assert.equal($("pick-elbow").disabled, true);
  assert.match(text("roc-desc"), /never flags anyone/);
  // the rest of step 5 and the steps after it are still drawn
  assert.equal(text("r-calls"), "0");
  assert.ok($("clients").children.length > 0);
  assert.ok($("t-psi").querySelectorAll("tr").length > 1);
});
