# Banking churn demo: let the machine find the rules

[![Test and deploy](https://github.com/FrtZi/banking-churn-demo/actions/workflows/deploy.yml/badge.svg)](https://github.com/FrtZi/banking-churn-demo/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**▶ Live demo: [frtzi.github.io/banking-churn-demo](https://frtzi.github.io/banking-churn-demo/)**

> **For educational purposes only.** This demo teaches data-literacy concepts with synthetic data. It is not a production model, not financial, legal or model-validation advice, and its figures say nothing about any real bank or client.

An interactive page that shows business people how a prediction model works, without any code.
A decision tree learns live which private-banking clients are likely to leave. The page then shows
the rules it found, the mistakes it makes, and what those mistakes cost.

It was built for the _Data Analytics in Banking – Essentials_ training by [Altaïra](https://altaira.eu),
as the follow-up to a paper game in which participants play the model themselves.

![Step 3 of the demo: the decision tree, and the search for the best number of questions](docs/screenshot.png)

## What the audience sees

| Step              | Content                                                                                                                                                                                                                                                                                                 | Key message                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 · The data      | Synthetic clients (default 500, adjustable 100–5,000), a learn/test split (default 80/20), new random samples; warnings when there is too little data to learn or to check the model; tick boxes to add bad data quality to the history (missing dates, lost complaints, wrong outcomes, biased sample) | A model learns from the past, some facts never reach the data, and too little data gives unstable results                                       |
| 2 · Your rules    | The room writes the rules it used in the paper game, before seeing anything from the machine (no score shown yet)                                                                                                                                                                                       | Capturing human rules first avoids anchoring on the machine's answer                                                                            |
| 3 · Train         | The decision tree with two controls (number of questions, minimum group size as a % of clients); an animated search that scores every level on hidden clients (5-fold cross-validation) and draws learned vs hidden curves; predictions for new clients                                                 | Past the best level the model memorizes noise: better on the past, worse and falsely certain on new clients. The level is measured, not guessed |
| 4 · Rules         | Each branch as a plain-English rule, next to the room's rules, now scored against the machine on the same unseen clients                                                                                                                                                                                | A good model can be read and challenged; the most intuitive signal is not always the useful one                                                 |
| 5 · Results       | Confusion matrix, sensitivity and specificity on unseen clients; a ROC curve with the “elbow”, the best-€ threshold and the room's point; a business view in €                                                                                                                                          | Accuracy alone is misleading; the threshold can be chosen automatically, but the right criterion is a business decision                         |
| 6 · Our 8 clients | The model's verdict on the 8 clients of the paper game, then the reveal                                                                                                                                                                                                                                 | Model + human judgement beats either alone                                                                                                      |
| 7 · Monitor       | The model in production on 1,000 new 2026 clients; tick boxes break the incoming data (complaint feed, CRM migration, app tracking, format change); a drift monitor (Population Stability Index per signal) next to what the model does today and what it costs months later                            | The model did not change, the data did; monitoring the inputs gives the alert months before the losses show, and an alert must be qualified     |

## Using it in a session

- Open the live link, or save the page (it is a single file) and open it offline from a laptop or a USB stick.
- The ← → arrow keys move between steps. `#1` to `#7` at the end of the URL opens a given step.
- Participants can follow on their phones: the layout adapts to small screens.

## Running it locally

Requires [Node.js](https://nodejs.org) 20 or later. The published page is one self-contained file with no runtime
dependency; the development tools below are dev dependencies only.

```bash
npm ci          # install the development tools
npm run dev     # serves src/ at http://localhost:5173: edit a file, reload the page (no build step)
npm run build   # bundles everything into the single-file page dist/index.html
npm test        # builds, then runs the engine tests and the end-to-end tests of the page
npm run check   # formatting (Prettier), lint (ESLint), tests, HTML validation (html-validate)
npm run format  # formats every file
```

```
src/index.html   page shell (head, header, footer)
src/sections/    the text and structure of each step, one file per step
src/main.js      entry point: binds every step, then draws the page
src/engine/      the model, with no DOM: synthetic data, decision tree, evaluation, data quality, drift
src/ui/          the page: state, render pipeline, one folder per step, charts, glossary
src/styles/      design tokens, components and one stylesheet per step
scripts/         page assembly, build (esbuild, single file) and dev server
tests/           engine tests, page assembly tests, and end-to-end tests that check every figure of the speaker notes
```

How the modules fit together, and how to add a step, a signal or a data-quality issue:
[ARCHITECTURE.md](ARCHITECTURE.md).

Every push to `main` runs `npm run check` and deploys the page to GitHub Pages.

### Where to change things

| To change                                                | Edit                                                                       |
| -------------------------------------------------------- | -------------------------------------------------------------------------- |
| Training default data (500 clients, seed, 80/20)         | `DEFAULTS.data` in `src/engine/config.js` (the speaker notes depend on it) |
| How the synthetic clients behave                         | `WORLD` in `src/engine/world.js`                                           |
| Tree, cross-validation, production batch, PSI thresholds | `DEFAULTS` in `src/engine/config.js`                                       |
| Data-quality problems and their parameters               | `TRAINING_ISSUES` / `INFERENCE_ISSUES` in `src/engine/quality.js`          |
| The 8 clients of the game, the room's example rules      | `GAME` / `ROOM_EXAMPLE` in `src/engine/game.js`                            |
| Slider ranges, business assumptions, animation timings   | `CONFIG` in `src/ui/config.js`                                             |
| Chart colours / page colours                             | `THEME` in `src/ui/theme.js` / tokens in `src/styles/tokens.css`           |
| Definitions and glossary links                           | `src/ui/glossary/terms.js`                                                 |
| Page text (titles, explanations, labels)                 | `src/sections/<step>.html`                                                 |
| The signals (names, units, levels)                       | `FEATURES` in `src/engine/features.js`                                     |

## Terminology

Technical terms are underlined with dots: hover, focus or tap shows a short definition, and a click opens the matching entry of the [Google Machine Learning Glossary](https://developers.google.com/machine-learning/glossary), the single reference used throughout.

## About the data

The training default is **500 clients, 80/20, sample 1**: every figure in the speaker notes assumes it, and _Reset to training default_ brings it back. Other settings are meant for exploration (e.g. 100 clients to show how unstable a model trained on too little data is).

The data is **entirely synthetic**. It is generated with a fixed seed, so every run shows the same
numbers. No real bank, client or person is represented. Churn depends on asset trend, time since
the last advisor contact, advisor change, complaints, app usage and products held.

Two facts are deliberately generated but **not** exposed to the model: competitor offers and house
purchases. They produce the errors that no model can avoid, which is one of the points of the demo.

## License

[MIT](LICENSE) © 2026 Altaïra. You are welcome to reuse it for your own training sessions.
