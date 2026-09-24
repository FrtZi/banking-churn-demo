import { countLeavers, FEATURES } from "../../../engine/index.js";
import { CONFIG, DEFAULT_DATA } from "../../config.js";
import { $, setTexts } from "../../dom.js";
import { featureCell, featureHeader, int, pct, plural, warn } from "../../format.js";
import { isDefaultData, leaverRate, state } from "../../state.js";

/** Preview columns: the client, every signal, the outcome. Each is [title, cell HTML of a client]. */
const COLUMNS = [
  ["Client", (r) => r.id],
  ...FEATURES.map((f) => [featureHeader(f), (r) => featureCell(f, r[f.key])]),
  ["Outcome", (r) => (r.churn ? `<span class="left">Left</span>` : "Stayed")],
];

function previewTable() {
  const preview = state.data.slice(0, CONFIG.data.previewRows);
  const head = `<tr>${COLUMNS.map(([title]) => `<th scope="col">${title}</th>`).join("")}</tr>`;
  const body = preview.map((r) => `<tr>${COLUMNS.map(([, cell]) => `<td>${cell(r)}</td>`).join("")}</tr>`).join("");
  const more = `<tr><td colspan="${COLUMNS.length}" class="note">… ${int(state.data.length - preview.length)} more clients</td></tr>`;
  return head + body + more;
}

/** Which settings are used, and warnings when there is too little data to learn from or to check the model. */
function notes() {
  const { gen, train, test } = state;
  const learnLeavers = countLeavers(train);
  const testLeavers = countLeavers(test);
  const issues = Object.keys(gen.quality).length;
  const d = DEFAULT_DATA;
  const out = [
    isDefaultData()
      ? `Training default (${d.n} clients, ${d.split}/${100 - d.split}, sample 1): the figures in the speaker notes assume these settings.`
      : `Custom data (sample ${gen.sample}): the figures differ from the speaker notes.`,
  ];
  if (issues) {
    out.push(
      warn(`Bad data quality in the learning data: ${issues} ${plural(issues, "problem")} applied (see below).`),
    );
  }
  if (learnLeavers < CONFIG.data.warnBelow.learnLeavers) {
    out.push(
      warn(
        `Only <b>${learnLeavers}</b> ${plural(learnLeavers, "leaver")} to learn from: the tree has very little to learn.`,
      ),
    );
  }
  if (testLeavers < CONFIG.data.warnBelow.testLeavers) {
    out.push(
      warn(
        `Only <b>${testLeavers}</b> ${plural(testLeavers, "leaver")} among the ${int(test.length)} test clients: step 5 results will swing a lot, too little to confirm the model.`,
      ),
    );
  }
  return out.join("<br>");
}

/** Step 1: key figures, generator controls, preview table and notes. */
export function drawData() {
  const { gen, data, train, test } = state;
  setTexts({
    "k-lead": int(data.length),
    "k-n": int(data.length),
    "k-train": int(train.length),
    "k-test": int(test.length),
    "k-rate": pct(leaverRate(data)),
    "gen-split-o": `${gen.split}% learn · ${100 - gen.split}% test`,
  });
  $("gen-n").value = String(gen.n);
  $("gen-split").value = gen.split;
  $("gen-split").setAttribute("aria-valuetext", `${gen.split}% to learn, ${100 - gen.split}% to test`);
  $("t-data").innerHTML = previewTable();
  $("gen-note").innerHTML = notes();
}
