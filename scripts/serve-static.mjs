#!/usr/bin/env node
// Zero-dependency static file server. The mountain playground uses ES modules,
// which browsers refuse to load from a file:// URL.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const rootArg = process.argv[2];
if (!rootArg) {
  console.error("Usage: node scripts/serve-static.mjs <directory> [port]");
  process.exit(1);
}

const root = resolve(rootArg);
const port = Number(process.argv[3] || process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bin": "application/octet-stream",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function insideRoot(file) {
  return file === root || file.startsWith(root + sep);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";

    let file = resolve(root, `.${pathname}`);
    if (!insideRoot(file)) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }

    let info = await stat(file);
    if (info.isDirectory()) {
      file = resolve(file, "index.html");
      if (!insideRoot(file)) {
        response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
      }
      info = await stat(file);
    }

    const body = await readFile(file);
    const type = types[extname(file).toLowerCase()] ?? "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": type,
      "Content-Length": body.length,
      "Cache-Control": "no-cache",
    });
    response.end(body);
  } catch (error) {
    if (error && (error.code === "ENOENT" || error.code === "ENOTDIR")) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    console.error(error);
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root}`);
  console.log(`http://127.0.0.1:${port}/`);
});
