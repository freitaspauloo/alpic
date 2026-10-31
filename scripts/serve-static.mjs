// Zero-dependency static server so the mountain playground can load ES modules.
// Usage: node scripts/serve-static.mjs <directory> <port>
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";

const root = resolve(process.argv[2] ?? "playground/mountain");
const port = Number(process.argv[3] ?? 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".bin": "application/octet-stream",
};

function insideRoot(file) {
  return file === root || file.startsWith(root + sep);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    // Browsers request this automatically. An empty response keeps the console quiet.
    if (url.pathname === "/favicon.ico") {
      response.writeHead(204).end();
      return;
    }
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    if (rel.includes("\0")) {
      response.writeHead(400).end("Bad request");
      return;
    }
    let file = resolve(root, rel);
    if (!insideRoot(file)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const info = await stat(file);
    if (info.isDirectory()) {
      file = join(file, "index.html");
    }
    const body = await readFile(file);
    response.writeHead(200, {
      "Content-Type": types[extname(file)] ?? "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": "no-cache",
    });
    response.end(body);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(500).end("Server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root}`);
  console.log(`http://127.0.0.1:${port}`);
});
