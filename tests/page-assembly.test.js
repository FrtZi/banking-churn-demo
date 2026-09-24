// The page is assembled from src/index.html and src/sections/: the build and the dev server share this step.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { assemblePage } from "../scripts/page.mjs";

const SRC = fileURLToPath(new URL("../src", import.meta.url));

test("every section is included once, in step order, with no marker left", () => {
  const html = assemblePage(SRC);
  assert.doesNotMatch(html, /@include/);
  const ids = [...html.matchAll(/<section id="s-(\w+)">/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["data", "room", "train", "rules", "results", "clients", "monitor"]);
  assert.equal(ids.length, readdirSync(`${SRC}/sections`).length, "a section file is not included");
});

test("an included section keeps the indentation of its marker", () => {
  assert.match(assemblePage(SRC), /\n {6}<section id="s-data">\n {8}<h2/);
});

test("the published page is one file: styles and scripts inlined, no dev hint", () => {
  const dist = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.doesNotMatch(dist, /<link rel="stylesheet"|<script [^>]*src=|<p id="dev-hint"|@include/);
  assert.match(dist, /<style>/);
  assert.match(dist, /<script>/);
});
