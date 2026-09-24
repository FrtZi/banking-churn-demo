import { GLOSSARY } from "./terms.js";

/** URL of a term's entry in the reference glossary, or null when the term has none. */
export const termUrl = (key) => {
  const anchor = GLOSSARY.terms[key] && GLOSSARY.terms[key].anchor;
  return anchor ? `${GLOSSARY.url}#${anchor}` : null;
};

/** HTML of a dotted term: a real link when it has a reference (click / Enter opens it), else focusable text. */
export const term = (key, text) =>
  termUrl(key)
    ? `<a class="term" data-term="${key}" href="${termUrl(key)}" target="_blank" rel="noopener">${text}<span class="sr-only"> (glossary, opens in a new tab)</span></a>`
    : `<span class="term" tabindex="0" data-term="${key}">${text}</span>`;

/** Terms written in the static HTML as `<span class="term" data-term>` become links too. */
export function linkStaticTerms() {
  document.querySelectorAll("span.term[data-term]").forEach((el) => {
    if (termUrl(el.dataset.term)) el.outerHTML = term(el.dataset.term, el.innerHTML);
  });
}
