import { leaves } from "../../../engine/index.js";
import { drawTreeChart } from "../../charts/tree-chart.js";
import { drawValidationChart } from "../../charts/validation-chart.js";
import { CONFIG } from "../../config.js";
import { $, setTexts } from "../../dom.js";
import { pct } from "../../format.js";
import { term } from "../../glossary/links.js";
import { minGroupPct, minLeaf, searchDone, state } from "../../state.js";

/** Step 3 slider read-outs. */
export function drawTrainControls() {
  $("depth").value = state.depth;
  $("minpct").value = state.minGroupIndex;
  setTexts({ "depth-o": `${state.depth}`, "minpct-o": `${minGroupPct()}% (${minLeaf()} clients)` });
  $("minpct").setAttribute("aria-valuetext", `${minGroupPct()}% of clients, ${minLeaf()} clients`);
}

/** Step 3: the tree and a note on the groups it makes. */
export function drawTree() {
  drawTreeChart($("tree"), state.tree);
  const risks = leaves(state.tree).map((l) => l.node.p);
  const beyondBest = searchDone() && state.depth > state.search.best;
  $("tree-note").innerHTML =
    `${risks.length} groups of clients, from ${pct(Math.min(...risks))} to ${pct(Math.max(...risks))} of leavers. ` +
    (beyondBest
      ? `Beyond ${state.search.best} questions the model starts memorizing noise (${term("overfitting", "overfitting")}).`
      : "More questions = more detail, but also more risk of learning noise.");
}

/** Step 3: validation curve (learned vs hidden clients by depth) and its conclusion. */
export function drawValidation() {
  const { search, shown } = state;
  const curve = search ? search.curve.slice(0, shown) : [];
  const done = searchDone();
  drawValidationChart($("vc"), {
    curve,
    best: search && search.best,
    done,
    depths: CONFIG.tree.maxDepth,
    current: state.depth,
  });
  if (done) {
    const best = search.curve[search.best - 1];
    const last = search.curve.at(-1);
    $("vc-desc").innerHTML =
      `Best level: ${best.depth} questions (${pct(best.hidden)} on hidden clients). ` +
      `At ${last.depth} questions the model scores ${pct(last.learned)} on the clients it learned from but only ${pct(last.hidden)} on hidden ones: it memorizes instead of generalizing (${term("overfitting", "overfitting")}).`;
  } else if (!state.searching) $("vc-desc").textContent = "";
}
