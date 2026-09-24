import { $ } from "../../dom.js";
import { refreshRoom } from "../../render.js";
import { newCondition, OP_LABEL, SIGNALS } from "../../room-model.js";
import { state } from "../../state.js";

const option = (value, label, selected) => `<option value="${value}" ${selected ? "selected" : ""}>${label}</option>`;

/** Controls of one condition: signal, then comparison + value, yes/no, or level, depending on the signal. */
function conditionControls(c, id, name) {
  const signals =
    option("", "—", false) +
    Object.entries(SIGNALS)
      .map(([k, s]) => option(k, s.feature.label, c && c.key === k))
      .join("");
  let html = `<select class="sig" id="${id}-key" aria-label="${name}: signal">${signals}</select>`;
  if (!c) return html;
  const s = SIGNALS[c.key];
  if (s.bool) {
    html += `<select id="${id}-val" aria-label="${name}: value">${option(1, "yes", c.yes)}${option(0, "no", !c.yes)}</select>`;
  } else if (s.choices) {
    html += `<select id="${id}-val" aria-label="${name}: value">${s.choices.map((v) => `<option ${c.choice === v ? "selected" : ""}>${v}</option>`).join("")}</select>`;
  } else {
    html += `<select id="${id}-op" aria-label="${name}: comparison">${s.ops.map((o) => option(o, OP_LABEL[o], c.op === o)).join("")}</select>`;
    html += `<input type="number" id="${id}-val" aria-label="${name}: value" value="${c.value}" step="${s.step}">`;
  }
  return html;
}

function ruleBox(rule, i) {
  const conditions = rule
    .map((c, j) =>
      // an AND line appears once the first condition of the rule is set
      j && !rule[0] && !c
        ? ""
        : `<div class="cond">${j ? '<span class="and">AND</span>' : ""}${conditionControls(c, `r${i}c${j}`, `Rule ${i + 1}, condition ${j + 1}`)}</div>`,
    )
    .join("");
  return `<fieldset class="rule-box"><legend>Rule ${i + 1}</legend>${conditions}</fieldset>`;
}

function bindCondition(i, j) {
  const id = `r${i}c${j}`;
  if (!$(`${id}-key`)) return;
  $(`${id}-key`).onchange = (e) => {
    state.room[i][j] = newCondition(e.target.value);
    drawRoomBuilder();
    refreshRoom();
  };
  const c = state.room[i][j];
  if (!c) return;
  const op = $(`${id}-op`);
  const value = $(`${id}-val`);
  if (op) {
    op.onchange = () => {
      c.op = op.value;
      refreshRoom();
    };
  }
  value.oninput = value.onchange = () => {
    if (SIGNALS[c.key].bool) c.yes = value.value === "1";
    else if (SIGNALS[c.key].choices) c.choice = value.value;
    else c.value = Number(value.value) || 0;
    refreshRoom();
  };
}

/** Step 2: the rule builder (redrawn when a signal changes; the focus stays on the edited control). */
export function drawRoomBuilder() {
  const focused = document.activeElement && document.activeElement.id;
  $("room-rules").innerHTML = state.room.map(ruleBox).join("");
  state.room.forEach((rule, i) => rule.forEach((_, j) => bindCondition(i, j)));
  if (focused && $(focused)) $(focused).focus();
}
