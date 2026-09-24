import { CONFIG } from "./config.js";
import { $ } from "./dom.js";
import { state } from "./state.js";
import { drawTree } from "./steps/train/draw.js";

/** Shows step `index` (0-based), updates the URL hash and moves the focus to the step heading. */
export function go(index, moveFocus = true) {
  state.step = Math.max(0, Math.min(CONFIG.steps.length - 1, index));
  document.querySelectorAll("main > section").forEach((s, k) => s.classList.toggle("on", k === state.step));
  document.querySelectorAll("nav button").forEach((b, k) => {
    b.classList.toggle("on", k === state.step);
    b.toggleAttribute("aria-current", k === state.step);
  });
  if (CONFIG.steps[state.step] === "Train") drawTree(); // the SVG needs a visible box to size its text
  history.replaceState(null, "", `#${state.step + 1}`);
  if (moveFocus) document.querySelector("section.on h2").focus({ preventScroll: false });
}

export const goTo = (stepName) => go(CONFIG.steps.indexOf(stepName));

/** Step buttons, plus ← → / PageUp PageDown when the focus is not in a form field. */
export function bindNavigation() {
  CONFIG.steps.forEach((name, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<b>${i + 1}</b>${name}`;
    b.onclick = () => go(i);
    $("nav").appendChild(b);
  });
  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
    const move = { ArrowRight: 1, PageDown: 1, ArrowLeft: -1, PageUp: -1 }[e.key];
    if (!move) return;
    e.preventDefault();
    go(state.step + move);
  });
}

/** Opens the step given in the URL hash (#1..#7), without stealing the focus. */
export const openFromHash = () => go((parseInt(location.hash.slice(1), 10) || 1) - 1, false);
