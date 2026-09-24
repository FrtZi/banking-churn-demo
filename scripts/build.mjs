// Builds the single self-contained page: inlines src/core.js into src/template.html -> dist/index.html
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const template = readFileSync(join(root, "src", "template.html"), "utf8");
const core = readFileSync(join(root, "src", "core.js"), "utf8");
if (!template.includes("/*CORE*/")) throw new Error("template.html is missing the /*CORE*/ placeholder");

const out = join(root, "dist", "index.html");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, template.replace("/*CORE*/", () => core));
console.log(`${out} (${Math.round(statSync(out).size / 1024)} KB)`);
