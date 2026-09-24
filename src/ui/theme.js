import { CONFIG } from "./config.js";

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Chart colours (SVG). Named colours are read from the CSS tokens (src/styles/tokens.css): one source of truth. */
export const THEME = {
  // share of leavers is a magnitude: one-hue sequential ramp, dark (near 0%) to light; it starts at step 550
  // so the darkest step still clears 2:1 against the card
  ramp: ["#1c5cab", "#256abf", "#2a78d6", "#3987e5", "#5598e7", "#6da7ec", "#86b6ef", "#9ec5f4", "#b7d3f6", "#cde2fb"],
  // text on the ramp: black from step 2 up (#0b0b0b would give only 4.46:1 on step 2), white below; >= 4.7:1
  inkOnRamp: { light: "#ffffff", dark: "#000000", darkFromStep: 2 },
  text: cssVar("--text"),
  muted: cssVar("--muted"),
  card: cssVar("--card"),
  page: cssVar("--bg"),
  grid: cssVar("--grid"),
  edge: cssVar("--edge"),
  edgeLabel: { text: cssVar("--edge-label"), stroke: cssVar("--line") },
  learned: cssVar("--series-learned"),
  hidden: cssVar("--series-hidden"),
  room: cssVar("--series-hidden"),
  curve: cssVar("--series-learned"),
  bestBand: cssVar("--best-band"),
};

const rampStep = (p) => Math.round(Math.min(1, p / CONFIG.riskScale.colourMax) * (THEME.ramp.length - 1));

/** Colour of a share of leavers. */
export const riskColour = (p) => THEME.ramp[rampStep(p)];

/** Readable text colour on top of riskColour(p). */
export const inkOn = (p) =>
  rampStep(p) >= THEME.inkOnRamp.darkFromStep ? THEME.inkOnRamp.dark : THEME.inkOnRamp.light;

/** Inner fill of a .bar for a share of leavers (`max` = share that fills the whole bar). */
export const riskBar = (p, max = CONFIG.riskScale.barMax) =>
  `<i style="width:${Math.max(3, (p * 100) / max)}%;background:${riskColour(p)}"></i>`;
