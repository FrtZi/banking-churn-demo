import { featureByKey, predict, train } from "../../../engine/index.js";
import { CONFIG } from "../../config.js";
import { $ } from "../../dom.js";
import { featureValue, pct, warn } from "../../format.js";
import { term } from "../../glossary/links.js";
import { isDefaultData, minLeafFor, state } from "../../state.js";
import { riskBar } from "../../theme.js";

let cache = null;

/** Three unseen clients to show: the storyline ones on the default data, else those whose risk swings most. */
function picks() {
  if (cache && cache.data === state.data) return cache.picks;
  const cfg = CONFIG.inference;
  let chosen;
  if (isDefaultData()) {
    chosen = cfg.ids.map((id) => state.test.find((r) => r.id === id));
  } else {
    const sensible = train(state.train, cfg.sensible.depth, minLeafFor(cfg.sensible.minGroupPct));
    const over = train(state.train, cfg.overfitted.depth, minLeafFor(cfg.overfitted.minGroupPct));
    const swing = (r) => Math.abs(predict(over, r) - predict(sensible, r));
    chosen = [...state.test].sort((a, b) => swing(b) - swing(a)).slice(0, cfg.ids.length);
  }
  cache = { data: state.data, picks: chosen };
  return chosen;
}

/** The client's main signals on one line: "complaint · app dropping · assets -12% · contact 7 m". */
const signalsOf = (c) =>
  [
    c.complaint ? "complaint" : "",
    `app ${c.app}`,
    `assets ${featureValue(featureByKey("assets"), c.assets)}`,
    `contact ${c.contact} m`,
    c.advisor ? "advisor changed" : "",
  ]
    .filter(Boolean)
    .join(" · ");

/** Overfitting seen in the predictions: unstable, falsely certain risks for new clients. */
export function drawInference() {
  $("inference").innerHTML = picks()
    .map((c) => {
      const p = predict(state.tree, c);
      return `<div class="inf-row"><span>Client #${c.id.slice(1)}<br><span class="note">${signalsOf(c)}</span></span><b>${pct(p)}</b><div class="bar" aria-hidden="true">${riskBar(p, 1)}</div></div>`;
    })
    .join("");
  const extreme = state.test.filter((r) => [0, 1].includes(predict(state.tree, r))).length;
  $("certainty").innerHTML = extreme
    ? warn(
        `<b>${extreme} of ${state.test.length}</b> new clients get a 0% or 100% prediction: ${term("certainty", "false certainty")}.`,
      )
    : "No new client gets a 0% or 100% prediction.";
}
