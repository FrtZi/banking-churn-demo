import { $ } from "../dom.js";
import { GLOSSARY } from "./terms.js";

/**
 * One tooltip for every dotted term: shown on hover, keyboard focus or tap; closed with Escape, a second tap,
 * a tap elsewhere or scrolling. On touch, the first tap on a link shows the definition, the second follows it.
 */
export function setUpTooltip() {
  const tip = $("tip");
  let owner = null;
  let lastPointer = "mouse";

  const place = (el) => {
    const box = el.getBoundingClientRect();
    tip.style.left = "0px";
    tip.style.top = "0px";
    tip.classList.add("on");
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const left = Math.min(Math.max(8, box.left + box.width / 2 - w / 2), innerWidth - w - 8);
    const top = box.top - h - 8 >= 8 ? box.top - h - 8 : box.bottom + 8; // above if it fits, else below
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  };
  const show = (el) => {
    const entry = GLOSSARY.terms[el.dataset.term];
    if (!entry) return;
    owner = el;
    const more = `${lastPointer === "touch" ? "Tap again" : "Click"} for more: ${GLOSSARY.source} ↗`;
    tip.innerHTML = `<b>${entry.title}</b>${entry.text}${el.tagName === "A" ? `<span class="more">${more}</span>` : ""}`;
    tip.setAttribute("aria-hidden", "false");
    el.setAttribute("aria-describedby", "tip");
    place(el);
  };
  const hide = () => {
    if (owner) owner.removeAttribute("aria-describedby");
    owner = null;
    tip.classList.remove("on");
    tip.setAttribute("aria-hidden", "true");
  };
  const termOf = (e) => e.target.closest && e.target.closest(".term");
  const onClick = (e) => {
    const el = termOf(e);
    if (!el) return hide();
    if (el.tagName === "A") {
      if (lastPointer === "touch" && el !== owner) {
        e.preventDefault();
        show(el);
      }
      return; // mouse click, keyboard Enter or second tap: follow the link
    }
    if (el === owner) hide();
    else show(el);
  };

  document.addEventListener("mouseover", (e) => termOf(e) && show(termOf(e)));
  document.addEventListener("mouseout", (e) => termOf(e) && hide());
  document.addEventListener("focusin", (e) => (termOf(e) ? show(termOf(e)) : hide()));
  document.addEventListener("focusout", (e) => termOf(e) && hide());
  document.addEventListener("pointerdown", (e) => (lastPointer = e.pointerType), true);
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", (e) => e.key === "Escape" && hide());
  addEventListener("scroll", hide, { passive: true });
}
