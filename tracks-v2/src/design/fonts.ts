import { useSyncExternalStore } from "react";

export type FontChoice = { id: string; label: string; value: string };
export type UploadedFont = { family: string; file: string; role: "sans" | "mono" };

const SANS = "ui-sans-serif, system-ui, sans-serif";
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = "ui-monospace, SFMono-Regular, monospace";

function face(name: string, fallback: string) {
  return `"${name}", ${fallback}`;
}

export const SANS_FONTS: FontChoice[] = [
  { id: "geist", label: "Geist", value: face("Geist Variable", SANS) },
  { id: "inter", label: "Inter", value: face("Inter Variable", SANS) },
  { id: "instrument", label: "Instrument Sans", value: face("Instrument Sans Variable", SANS) },
  { id: "manrope", label: "Manrope", value: face("Manrope Variable", SANS) },
  { id: "outfit", label: "Outfit", value: face("Outfit Variable", SANS) },
  { id: "dm-sans", label: "DM Sans", value: face("DM Sans Variable", SANS) },
  { id: "figtree", label: "Figtree", value: face("Figtree Variable", SANS) },
  { id: "jakarta", label: "Plus Jakarta Sans", value: face("Plus Jakarta Sans Variable", SANS) },
  { id: "space-grotesk", label: "Space Grotesk", value: face("Space Grotesk Variable", SANS) },
  { id: "sora", label: "Sora", value: face("Sora Variable", SANS) },
  { id: "ibm-plex", label: "IBM Plex Sans", value: face("IBM Plex Sans Variable", SANS) },
  { id: "bricolage", label: "Bricolage Grotesque", value: face("Bricolage Grotesque Variable", SANS) },
  { id: "system", label: "System", value: SANS },
  { id: "georgia", label: "Georgia", value: SERIF },
  { id: "newsreader", label: "Newsreader", value: face("Newsreader Variable", SERIF) },
  { id: "fraunces", label: "Fraunces", value: face("Fraunces Variable", SERIF) },
  { id: "source-serif", label: "Source Serif", value: face("Source Serif 4 Variable", SERIF) },
  { id: "literata", label: "Literata", value: face("Literata Variable", SERIF) },
  { id: "ibm-plex-serif", label: "IBM Plex Serif", value: face("IBM Plex Serif", SERIF) },
];

export const MONO_FONTS: FontChoice[] = [
  { id: "geist-mono", label: "Geist Mono", value: face("Geist Mono Variable", MONO) },
  { id: "jetbrains", label: "JetBrains Mono", value: face("JetBrains Mono Variable", MONO) },
  { id: "ibm-plex-mono", label: "IBM Plex Mono", value: face("IBM Plex Mono", MONO) },
  { id: "dm-mono", label: "DM Mono", value: face("DM Mono", MONO) },
  { id: "space-mono", label: "Space Mono", value: face("Space Mono", MONO) },
  { id: "system-mono", label: "System mono", value: MONO },
];

const ACCEPT = new Set(["woff2", "woff", "ttf", "otf"]);
const MAX_BYTES = 2 * 1024 * 1024;

let uploaded: UploadedFont[] = [];
const listeners = new Set<() => void>();
const installed = new WeakMap<Document, Set<string>>();

function emitFonts() {
  listeners.forEach((listener) => listener());
}

export function subscribeFonts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useUploadedFonts() {
  return useSyncExternalStore(subscribeFonts, () => uploaded, () => uploaded);
}

export function fontStack(font: UploadedFont) {
  return face(font.family, font.role === "mono" ? MONO : SANS);
}

export function installUploadedFonts(doc: Document) {
  let known = installed.get(doc);
  if (!known) {
    known = new Set();
    installed.set(doc, known);
  }
  for (const font of uploaded) {
    if (known.has(font.family)) continue;
    known.add(font.family);
    const face = new FontFace(font.family, `url(/api/fonts/file/${font.file})`);
    doc.fonts.add(face);
    void face.load();
  }
}

export async function loadSharedFonts() {
  try {
    const res = await fetch("/api/fonts", { cache: "no-store" });
    if (!res.ok) return;
    const list = (await res.json()) as UploadedFont[];
    if (!Array.isArray(list)) return;
    const next = list.filter((font) => font && typeof font.family === "string" && typeof font.file === "string");
    if (JSON.stringify(next) === JSON.stringify(uploaded)) {
      installUploadedFonts(document);
      return;
    }
    uploaded = next;
    installUploadedFonts(document);
    emitFonts();
  } catch {
    // The built-in catalog still works when the font file is unavailable.
  }
}

export async function uploadFont(file: File, role: "sans" | "mono") {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ACCEPT.has(ext) || file.size > MAX_BYTES) return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  const family = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  if (!family) return null;
  const res = await fetch("/api/fonts", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ family, ext, role, data: btoa(binary) }),
  });
  if (!res.ok) return null;
  await loadSharedFonts();
  const saved = uploaded.find((font) => font.family === family && font.role === role);
  return saved ? fontStack(saved) : null;
}
