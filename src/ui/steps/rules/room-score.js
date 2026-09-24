import { COHORTS, evaluate, evaluateRules } from "../../../engine/index.js";
import { $ } from "../../dom.js";
import { eur, pct } from "../../format.js";
import { describe, hasRules, roomRules } from "../../room-model.js";
import { calls, netValue, state } from "../../state.js";

const row = (label, a, b) => `<tr><th scope="row">${label}</th><td>${a}</td><td>${b}</td></tr>`;

/** Step 4: the room's rules in plain English, scored against the machine on the same unseen clients. */
export function drawRoomScore() {
  const { room, test } = state;
  const written = room.map((rule) => rule.filter(Boolean)).filter((r) => r.length);
  $("room-summary").innerHTML = written.map((r) => `<li>${r.map(describe).join(" <span>AND</span> ")}</li>`).join("");
  $("room-missing-note").textContent = state.roomMissing ? `Not in the data: ${state.roomMissing}` : "";
  if (!hasRules(room)) {
    $("room-vs").innerHTML = `<caption class="note">No rule entered at step 2: the room calls nobody.</caption>`;
    return;
  }
  const machine = evaluate(state.tree, test, state.threshold);
  const people = evaluateRules(roomRules(room), test);
  const leavers = machine.tp + machine.fn;
  $("room-vs").innerHTML =
    `<caption class="note">On the ${test.length} unseen clients of ${COHORTS.test}</caption>` +
    `<tr><th scope="col"></th><th scope="col">Room</th><th scope="col">Machine at ${pct(state.threshold)}</th></tr>` +
    row("Calls", calls(people), calls(machine)) +
    row("Leavers caught", `${people.tp} / ${leavers}`, `${machine.tp} / ${leavers}`) +
    row("False alarms", people.fp, machine.fp) +
    row("Net value", eur(netValue(people)), eur(netValue(machine)));
}
