import { $ } from "../dom.js";

const row = (group, key, issue, on, value) => {
  const id = `${group}-${key}`;
  return `<div class="issue">
    <label><input type="checkbox" id="${id}" value="${key}" ${on ? "checked" : ""}> <span>${issue.label}</span></label>
    <span class="param"><label for="${id}-v">${issue.param.name}</label>
      <input type="range" id="${id}-v" min="${issue.param.min}" max="${issue.param.max}" step="${issue.param.step}" value="${value}" ${on ? "" : "disabled"}>
      <output id="${id}-o" for="${id}-v">${value}${issue.param.unit}</output></span>
  </div>`;
};

/**
 * One row per data-quality issue: a tick box and its parameter, only editable once the box is ticked.
 * `selected` ({ issueKey: value }) is updated in place, then `onChange()` is called.
 */
export function renderIssueRows(box, group, catalog, selected, onChange) {
  box.querySelectorAll(".issue").forEach((r) => r.remove());
  box.insertAdjacentHTML(
    "beforeend",
    Object.entries(catalog)
      .map(([key, issue]) => row(group, key, issue, key in selected, selected[key] ?? issue.param.def))
      .join(""),
  );
  for (const [key, issue] of Object.entries(catalog)) {
    const tick = $(`${group}-${key}`);
    const range = $(`${group}-${key}-v`);
    const output = $(`${group}-${key}-o`);
    const label = () => {
      output.textContent = `${range.value}${issue.param.unit}`;
      range.setAttribute("aria-valuetext", `${range.value}${issue.param.unit} ${issue.param.name}`);
    };
    label();
    tick.onchange = () => {
      range.disabled = !tick.checked;
      if (tick.checked) selected[key] = +range.value;
      else delete selected[key];
      onChange();
    };
    range.oninput = () => {
      label();
      if (!tick.checked) return;
      selected[key] = +range.value;
      onChange();
    };
  }
}
