import { $ } from "../../dom.js";
import { state } from "../../state.js";
import { drawReveal } from "./draw.js";

/** Step 6 control: reveal / hide what really happened. */
export function bindClientsStep() {
  $("reveal").onclick = () => {
    state.revealed = !state.revealed;
    drawReveal();
  };
}
