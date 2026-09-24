// `npm run dev`: serves src/ without a build (edit a file, reload the page). The page is assembled from its
// sections on each request; the ES modules and stylesheets are served as they are (browsers refuse ES modules
// from file://, hence this small dependency-free server).
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { assemblePage } from "./page.mjs";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const port = Number(process.env.PORT) || 5173;
const TYPES = { ".js": "text/javascript", ".css": "text/css" };
const HTML = { "Content-Type": "text/html; charset=utf-8" };

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (path === "/" || path === "/index.html") {
    res.writeHead(200, HTML).end(assemblePage(srcDir));
    return;
  }
  const file = normalize(join(srcDir, path));
  const type = TYPES[extname(file)];
  if (!type || !file.startsWith(srcDir + sep) || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": `${type}; charset=utf-8` });
  createReadStream(file).pipe(res);
}).listen(port, "127.0.0.1", () => console.log(`Demo (source): http://localhost:${port}/`));
