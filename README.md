# Banking churn demo: let the machine find the rules

[![Test and deploy](https://github.com/FrtZi/banking-churn-demo/actions/workflows/deploy.yml/badge.svg)](https://github.com/FrtZi/banking-churn-demo/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**▶ Live demo: [frtzi.github.io/banking-churn-demo](https://frtzi.github.io/banking-churn-demo/)**

An interactive page that shows business people how a prediction model works, without any code.
A decision tree learns live which private-banking clients are likely to leave. The page then shows
the rules it found, the mistakes it makes, and what those mistakes cost.

It was built for the *Data Analytics in Banking – Essentials* training by [Altaïra](https://altaira.eu),
as the follow-up to a paper game in which participants play the model themselves.

![The decision tree step of the demo](docs/screenshot.png)

## What the audience sees

| Step | Content | Key message |
|---|---|---|
| 1 · The data | Synthetic clients (default 500, adjustable 100–5,000), a learn/test split (default 80/20), new random samples; warnings when there is too little data to learn or to check the model | A model learns from the past, some facts never reach the data, and too little data gives unstable results |
| 2 · Your rules | The room writes the rules it used in the paper game, before seeing anything from the machine (no score shown yet) | Capturing human rules first avoids anchoring on the machine's answer |
| 3 · Train | The decision tree with two controls (number of questions, minimum group size as a % of clients); an animated search that scores every level on hidden clients (5-fold cross-validation) and draws learned vs hidden curves; predictions for new clients | Past the best level the model memorizes noise: better on the past, worse and falsely certain on new clients. The level is measured, not guessed |
| 4 · Rules | Each branch as a plain-English rule, next to the room's rules, now scored against the machine on the same unseen clients | A good model can be read and challenged; the most intuitive signal is not always the useful one |
| 5 · Results | Confusion matrix, sensitivity and specificity on unseen clients; a ROC curve with the “elbow”, the best-€ threshold and the room's point; a business view in € | Accuracy alone is misleading; the threshold can be chosen automatically, but the right criterion is a business decision |
| 6 · Our 8 clients | The model's verdict on the 8 clients of the paper game, then the reveal | Model + human judgement beats either alone |

## Using it in a session

- Open the live link, or save the page (it is a single file) and open it offline from a laptop or a USB stick.
- The ← → arrow keys move between steps. `#1` to `#6` at the end of the URL opens a given step.
- Participants can follow on their phones: the layout adapts to small screens.

## Running it locally

Requires [Node.js](https://nodejs.org) 20 or later. There are no dependencies to install.

```bash
npm test        # checks the data generator, the tree and the teaching storyline
npm run build   # writes the single-file page to dist/index.html
```

```
src/core.js         synthetic data generator (seeded) and CART decision tree, no dependencies
src/template.html   page layout, styles and interactions; core.js is inlined at build time
scripts/build.mjs   produces dist/index.html
tests/              unit tests (Node's built-in test runner)
```

Every push to `main` runs the tests and deploys the page to GitHub Pages.

## About the data

The training default is **500 clients, 80/20, sample 1**: every figure in the speaker notes assumes it, and *Reset to training default* brings it back. Other settings are meant for exploration (e.g. 100 clients to show how unstable a model trained on too little data is).


The data is **entirely synthetic**. It is generated with a fixed seed, so every run shows the same
numbers. No real bank, client or person is represented. Churn depends on asset trend, time since
the last advisor contact, advisor change, complaints, app usage and products held.

Two facts are deliberately generated but **not** exposed to the model: competitor offers and house
purchases. They produce the errors that no model can avoid, which is one of the points of the demo.

## License

[MIT](LICENSE) © 2026 Altaïra. You are welcome to reuse it for your own training sessions.
