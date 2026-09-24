import { GAME, predict } from "../../../engine/index.js";
import { $ } from "../../dom.js";
import { icon, pct } from "../../format.js";
import { state } from "../../state.js";
import { riskBar } from "../../theme.js";

/** The four outcomes of a decision, as in the confusion matrix of step 5: [label, icon, status]. */
function verdict(flagged, left) {
  if (flagged) return left ? ["Caught", "✔", "good"] : ["False alarm", "⚠", "warning"];
  return left ? ["Missed", "✘", "critical"] : ["Left alone", "✔", "good"];
}

function card(c) {
  const p = predict(state.tree, c);
  const flagged = p >= state.threshold;
  const [label, glyph, status] = verdict(flagged, c.churn);
  return `<div class="client"><div class="top"><span>${c.id} · ${c.name}</span><span class="actual">${c.churn ? "LEFT" : "STAYED"}</span></div>
    <div class="body"><div>Model risk</div><div class="risk">${pct(p)}</div>
    <div class="bar" aria-hidden="true">${riskBar(p)}</div>
    <div>${flagged ? "→ call this client" : "→ no action"}</div>
    <div class="verdict">${icon(status, glyph)} ${label}</div></div></div>`;
}

const rightCount = () => GAME.filter((c) => predict(state.tree, c) >= state.threshold === !!c.churn).length;

/** Step 6: the model's verdict on the game's 8 clients; outcomes stay hidden until the reveal. */
export function drawClients() {
  $("clients").innerHTML = GAME.map(card).join("");
  drawReveal();
}

/** Shows or hides the real outcomes, and the model's score once they are shown. */
export function drawReveal() {
  const { revealed } = state;
  $("clients").classList.toggle("hidden-reveal", !revealed);
  $("reveal").setAttribute("aria-pressed", String(revealed));
  $("reveal").textContent = revealed ? "Hide the answers" : "Reveal what really happened";
  $("g-summary").textContent = revealed
    ? `The model got ${rightCount()} of ${GAME.length} right. How did the room do?`
    : "";
}
