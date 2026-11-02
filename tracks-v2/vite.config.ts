import fs from "node:fs";
import path from "node:path";
import type { Connect } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const designFile = path.resolve(__dirname, ".design-store.json");
const shippedThemeFile = path.resolve(__dirname, "src/design/shipped-theme.json");
const fontsDir = path.resolve(__dirname, ".fonts");
const fontIndex = path.resolve(fontsDir, "index.json");

const FONT_TYPES: Record<string, string> = {
  woff2: "font/woff2",
  woff: "font/woff",
  ttf: "font/ttf",
  otf: "font/otf",
};

function readFontIndex() {
  try {
    const list = JSON.parse(fs.readFileSync(fontIndex, "utf8"));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Uploaded font files, shared by every window on this machine. */
function fontStore(): import("vite").Plugin {
  const handle: Connect.NextHandleFunction = (req, res, next) => {
    const url = req.url?.split("?")[0] ?? "";
    if (req.method === "GET" && (url === "/" || url === "")) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(readFontIndex()));
      return;
    }
    if (req.method === "GET" && url.startsWith("/file/")) {
      const file = path.basename(url.slice("/file/".length));
      const ext = file.split(".").pop()?.toLowerCase() ?? "";
      const full = path.resolve(fontsDir, file);
      if (!FONT_TYPES[ext] || !full.startsWith(fontsDir) || !fs.existsSync(full)) {
        res.statusCode = 404;
        res.end();
        return;
      }
      res.setHeader("Content-Type", FONT_TYPES[ext]);
      res.end(fs.readFileSync(full));
      return;
    }
    if (req.method === "PUT") {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      req.on("end", () => {
        let body: { family?: unknown; ext?: unknown; role?: unknown; data?: unknown };
        try {
          body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          res.statusCode = 400;
          res.end();
          return;
        }
        const ext = typeof body.ext === "string" ? body.ext.toLowerCase() : "";
        const family = typeof body.family === "string" ? body.family.replace(/[^\w .'-]/g, "").trim().slice(0, 40) : "";
        const role = body.role === "mono" ? "mono" : "sans";
        const data = typeof body.data === "string" ? body.data : "";
        if (!FONT_TYPES[ext] || !family || data.length > 3_000_000) {
          res.statusCode = 400;
          res.end();
          return;
        }
        const slug = family.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "font";
        const file = `${slug}.${ext}`;
        fs.mkdirSync(fontsDir, { recursive: true });
        fs.writeFileSync(path.join(fontsDir, file), Buffer.from(data, "base64"));
        const list = readFontIndex().filter((item) => !item || item.file !== file);
        list.push({ family, file, role });
        fs.writeFileSync(fontIndex, JSON.stringify(list));
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(list));
      });
      return;
    }
    next();
  };
  return {
    name: "tracks-font-store",
    configureServer(server) {
      server.middlewares.use("/api/fonts", handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/fonts", handle);
    },
  };
}

/** One design file for every browser window on this machine. */
function designStore(): import("vite").Plugin {
  const handle: Connect.NextHandleFunction = (req, res, next) => {
    if (req.method === "GET") {
      res.setHeader("Content-Type", "application/json");
      const file = fs.existsSync(designFile) ? designFile : shippedThemeFile;
      res.end(fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "{}");
      return;
    }
    if (req.method === "PUT") {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      req.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        let next: {
          design?: unknown;
          activeId?: unknown;
          custom?: unknown;
          overrides?: unknown;
          removed?: unknown;
          revision?: unknown;
        };
        try {
          next = JSON.parse(body);
        } catch {
          res.statusCode = 400;
          res.end();
          return;
        }
        let prev: {
          design?: unknown;
          activeId?: unknown;
          custom?: unknown;
          overrides?: unknown;
          removed?: unknown;
          revision?: unknown;
        } = {};
        try {
          prev = JSON.parse(fs.readFileSync(designFile, "utf8"));
        } catch {
          prev = {};
        }
        const prevRev = typeof prev.revision === "number" ? prev.revision : 0;
        const nextRev = typeof next.revision === "number" ? next.revision : 0;
        const incomingWins = nextRev >= prevRev;
        const removed = new Set<string>([
          ...(Array.isArray(prev.removed) ? prev.removed.filter((id): id is string => typeof id === "string") : []),
          ...(Array.isArray(next.removed) ? next.removed.filter((id): id is string => typeof id === "string") : []),
        ]);
        const themeId = (theme: unknown) =>
          theme && typeof theme === "object" && "id" in theme && typeof (theme as { id?: unknown }).id === "string"
            ? (theme as { id: string }).id
            : null;
        const themes = new Map<string, unknown>();
        for (const theme of Array.isArray(prev.custom) ? prev.custom : []) {
          const id = themeId(theme);
          if (id && !removed.has(id)) themes.set(id, theme);
        }
        for (const theme of Array.isArray(next.custom) ? next.custom : []) {
          const id = themeId(theme);
          if (!id || removed.has(id)) continue;
          if (incomingWins || !themes.has(id)) themes.set(id, theme);
        }
        const readOverrides = (value: unknown) =>
          value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
        const overrides: Record<string, unknown> = { ...(readOverrides(prev.overrides) ?? {}) };
        const nextOverrides = readOverrides(next.overrides);
        if (nextOverrides) {
          for (const [id, design] of Object.entries(nextOverrides)) {
            if (!design || typeof design !== "object") continue;
            if (incomingWins || !overrides[id]) overrides[id] = design;
          }
        }
        let activeId = incomingWins && typeof next.activeId === "string" ? next.activeId : prev.activeId ?? next.activeId ?? "tracks";
        if (typeof activeId !== "string" || removed.has(activeId)) {
          const previous = typeof prev.activeId === "string" && !removed.has(prev.activeId) ? prev.activeId : "tracks";
          activeId = previous;
        }
        const merged = {
          design: incomingWins && next.design ? next.design : (prev.design ?? next.design ?? null),
          activeId,
          custom: [...themes.values()],
          overrides,
          removed: [...removed],
          revision: Math.max(prevRev, nextRev),
        };
        const saved = JSON.stringify(merged, null, 2) + "\n";
        fs.writeFileSync(designFile, saved);
        fs.writeFileSync(shippedThemeFile, saved);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(merged));
      });
      return;
    }
    next();
  };
  return {
    name: "tracks-design-store",
    configureServer(server) {
      server.middlewares.use("/api/design", handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/design", handle);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), designStore(), fontStore()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: { host: "127.0.0.1", port: 4175, strictPort: true },
  preview: { host: "127.0.0.1", port: 4175, strictPort: true },
});
