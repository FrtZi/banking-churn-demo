// Assembles src/index.html: each `<!-- @include path -->` line is replaced by that file (path relative to src/),
// indented like the marker. Shared by the build and the dev server, so both serve exactly the same page.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const INCLUDE = /^( *)<!-- @include ([\w/.-]+\.html) -->$/gm;

export function assemblePage(srcDir) {
  const read = (file) => readFileSync(join(srcDir, file), "utf8").trimEnd();
  return read("index.html").replace(INCLUDE, (_, indent, file) =>
    read(file)
      .split("\n")
      .map((line) => (line ? indent + line : line))
      .join("\n"),
  );
}
