// Small DOM and timing helpers.

export const $ = (id) => document.getElementById(id);

/** Sets the text of every element listed as { id: text }. */
export const setTexts = (texts) => Object.entries(texts).forEach(([id, text]) => ($(id).textContent = text));

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Reads a number input clamped to [0, max]; empty or invalid counts as 0. */
export const readNumber = (input, max = Infinity) => Math.min(max, Math.max(0, Number(input.value) || 0));
