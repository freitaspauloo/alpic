const STORAGE_KEY = "alpic-hero-playground-v5";

export type HeroConfig = {
  blur: number;
  brightness: number;
  contrast: number;
  saturate: number;
  scale: number;
  x: number;
  y: number;
  /** Width divided by height. 1.78 is 16:9. */
  aspect: number;
  squares: boolean;
  columns: number;
  gap: number;
  squareBlur: number;
  squareOpacity: number;
  density: number;
  variation: number;
  squareTint: number;
};

export const DEFAULT_HERO: HeroConfig = {
  blur: 0,
  brightness: 1,
  contrast: 1.05,
  saturate: 1,
  scale: 1,
  x: 50,
  y: 50,
  aspect: 1.78,
  squares: true,
  columns: 16,
  gap: 4,
  squareBlur: 8,
  squareOpacity: 0.22,
  density: 0.58,
  variation: 0.22,
  squareTint: 0.12,
};

type NumberKey = {
  [K in keyof HeroConfig]: HeroConfig[K] extends number ? K : never;
}[keyof HeroConfig];

export const SQUARE_FIELDS: { key: NumberKey; label: string; min: number; max: number; step: number; unit: (n: number) => string }[] = [
  { key: "columns", label: "Columns", min: 6, max: 24, step: 1, unit: (n) => `${Math.round(n)}` },
  { key: "gap", label: "Gap", min: 0, max: 16, step: 1, unit: (n) => `${Math.round(n)} px` },
  { key: "squareBlur", label: "Blur", min: 0, max: 32, step: 1, unit: (n) => `${Math.round(n)} px` },
  { key: "squareOpacity", label: "Opacity", min: 0.05, max: 0.7, step: 0.01, unit: (n) => `${Math.round(n * 100)}%` },
  { key: "density", label: "Coverage", min: 0.15, max: 1, step: 0.01, unit: (n) => `${Math.round(n * 100)}%` },
  { key: "variation", label: "Variation", min: 0, max: 1, step: 0.01, unit: (n) => `${Math.round(n * 100)}%` },
  { key: "squareTint", label: "Tint", min: 0, max: 1, step: 0.01, unit: (n) => `${Math.round(n * 100)}%` },
];

export const IMAGE_FIELDS: { key: NumberKey; label: string; min: number; max: number; step: number; unit: (n: number) => string }[] = [
  { key: "aspect", label: "Ratio", min: 1.2, max: 2.4, step: 0.01, unit: (n) => n.toFixed(2) },
  { key: "blur", label: "Blur", min: 0, max: 24, step: 0.5, unit: (n) => `${n.toFixed(1)} px` },
  { key: "brightness", label: "Brightness", min: 0.55, max: 1.5, step: 0.01, unit: (n) => `${Math.round(n * 100)}%` },
  { key: "contrast", label: "Contrast", min: 0.6, max: 1.6, step: 0.01, unit: (n) => `${Math.round(n * 100)}%` },
  { key: "saturate", label: "Saturation", min: 0, max: 1.6, step: 0.01, unit: (n) => `${Math.round(n * 100)}%` },
  { key: "scale", label: "Zoom", min: 1, max: 1.8, step: 0.01, unit: (n) => `${Math.round(n * 100)}%` },
  { key: "x", label: "Horizontal", min: 0, max: 100, step: 1, unit: (n) => `${Math.round(n)}%` },
  { key: "y", label: "Vertical", min: 0, max: 100, step: 1, unit: (n) => `${Math.round(n)}%` },
];

function unit(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Neighboring cells share a coarser value, so the tiles clump instead of speckling. */
function showCell(col: number, row: number, density: number) {
  const block = unit(Math.floor(col / 2) + 1, Math.floor(row / 2) + 1);
  const speck = unit(col + 8, row + 3);
  return block * 0.7 + speck * 0.3 < density;
}

function glassColor(col: number, row: number, opacity: number, tint: number, variation: number) {
  const tone = unit(col + 2, row + 5);
  const alpha = Math.min(0.75, opacity * (1 - variation * 0.85 + tone * variation));
  const shade = Math.round(255 - tint * (36 + tone * 28));
  const blue = Math.min(255, shade + Math.round(tint * 12));
  return `rgba(${shade}, ${shade}, ${blue}, ${alpha})`;
}

export function loadHeroConfig(): HeroConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_HERO;
    const parsed = JSON.parse(raw) as Partial<HeroConfig>;
    const next = { ...DEFAULT_HERO };
    (Object.keys(DEFAULT_HERO) as (keyof HeroConfig)[]).forEach((key) => {
      const value = parsed[key];
      if (typeof value === typeof DEFAULT_HERO[key]) {
        Object.assign(next, { [key]: value });
      }
    });
    return next;
  } catch {
    return DEFAULT_HERO;
  }
}

function HeroGrid({ config }: { config: HeroConfig }) {
  const columns = Math.round(config.columns);
  const rows = Math.ceil(columns / config.aspect) + 2;
  const cells = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const filled = showCell(col, row, config.density);
      cells.push(
        <div
          key={`${col}-${row}`}
          className="aspect-square"
          style={
            filled
              ? {
                  background: glassColor(col, row, config.squareOpacity, config.squareTint, config.variation),
                  backdropFilter: `blur(${config.squareBlur}px)`,
                  WebkitBackdropFilter: `blur(${config.squareBlur}px)`,
                }
              : undefined
          }
        />,
      );
    }
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: config.gap,
          padding: config.gap,
        }}
      >
        {cells}
      </div>
    </div>
  );
}

export function HeroVisual({ config }: { config: HeroConfig }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: String(config.aspect) }}>
      <img
        src="/landing/courchevel.jpg"
        alt="Courchevel in winter, a ski village beneath a high mountain ridge"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          objectPosition: `${config.x}% ${config.y}%`,
          transform: `scale(${config.scale})`,
          filter: `blur(${config.blur}px) brightness(${config.brightness}) contrast(${config.contrast}) saturate(${config.saturate})`,
        }}
      />
      {config.squares ? <HeroGrid config={config} /> : null}
    </div>
  );
}
