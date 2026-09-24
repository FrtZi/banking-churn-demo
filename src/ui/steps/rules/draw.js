import { leaves, ruleText } from "../../../engine/index.js";
import { $ } from "../../dom.js";
import { icon, pct } from "../../format.js";
import { state } from "../../state.js";
import { riskBar } from "../../theme.js";

/** Step 4: every leaf of the tree as a readable rule, riskiest first, tagged when above the threshold. */
export function drawRules() {
  $("rules").innerHTML = leaves(state.tree)
    .sort((a, b) => b.node.p - a.node.p)
    .map(
      ({ node, path }) => `
      <div class="rule">
        <div class="p">${pct(node.p)}</div>
        <div class="txt">${path.length ? ruleText(path).join(" <span>AND</span> ") : "All clients"}
          ${node.p >= state.threshold ? `<span class="tag">${icon("warning", "▲")} call</span>` : ""}
          <div class="note">${node.n} clients · ${node.pos} left</div></div>
        <div class="bar">${riskBar(node.p)}</div>
      </div>`,
    )
    .join("");
}
