# Alpic mountain playground

Interactive 3D Alpine massif from Alpic’s sign-in page ([idp.alpic.ai/sign-in](https://idp.alpic.ai/sign-in)).

This is Alpic’s own code and artwork, copied here for Paulo’s design trial. The renderer is the original dependency-free WebGL2 scene: a 513×513 16-bit heightmap (`alpine-massif.bin`) drawn with hand-written shaders. Nothing in the rendering logic was rewritten for this repo.

Drag the peaks to orbit. Arrow keys yaw and pitch, Home restores the opening view, and Space pauses the snow sparkle. If WebGL is unavailable, the static fallback `assets/alpic-mountain.png` stays visible.

## Run

From the repo root:

```bash
npm run mountain
```

Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/).

`npm run mountain` starts `scripts/serve-static.mjs`. There is no install step. The page imports `mountain.js` as an ES module, so a local HTTP server is required — opening `index.html` directly from disk will not load the terrain.

Pass another port as a second argument, or set `PORT`:

```bash
node scripts/serve-static.mjs playground/mountain 8080
```

## What’s in this folder

| Path | Role |
| --- | --- |
| `index.html` | Sign-in layout from the live page, with the OAuth script removed so the buttons stay visual. A favicon link points at the mountain artwork so the browser does not log a missing `/favicon.ico`. |
| `mountain.js` | Renderer. Heightmap URL is `./assets/alpine-massif.bin` so it loads from this folder. |
| `mountain-geometry.js` | Terrain mesh, camera constants, and the ground grid. Identical to the live page. |
| `assets/` | `alpine-massif.bin` (heightmap) and `alpic-mountain.png` (static fallback). |
| `source/` | Unmodified snapshot of the files served by idp.alpic.ai: `idp-signin.html`, `mountain.js`, `mountain-geometry.js`, and the same two assets. Leave this folder as the reference copy. Its `mountain.js` still requests `/assets/alpine-massif.bin`, and the HTML still contains the live sign-in script. |

The runnable `mountain.js` differs from `source/mountain.js` by that one asset path. `mountain-geometry.js` is the same file in both places.

## Where to tweak the look

Page chrome (midnight background `#051413`, type, the sign-in column) is the CSS at the top of `index.html`.

The mountain itself is tuned in `mountain.js`. Shader colors are RGB in the 0–1 range.

**Ink palette** — fragment shader, `main()`, the `ink = tone > …` chains:

- Snow (ice highlight down to deep teal) is the `if (snow)` branch.
- Rock (coral highlight down to near-black) is the `else` branch.
- A caught snow crystal flashes `vec3(1.0, 0.99, 0.94)`.

**Light direction** — same shader, just above those chains:

```js
vec3 sun = toLocal(normalize(vec3(-0.85, 0.7, 0.35)));
```

The first component is left/right, the second is how high the sun sits, the third is front/back. `toLocal` keeps the light attached to the yaw of the massif.

**Grid color** — the early-out at the top of `main()`:

```js
if (grid == 1) { color = vec4(0.18, 0.27, 0.25, 1); return; }
```

**Rotation speeds** — the `draw` loop and the pointer handler in `mountain.js`:

- Idle spin, after ~2.5s without input: `yaw += dt * 0.035`
- Drag yaw: `dx * 0.007` radians per pixel
- Mouse pitch while dragging: vertical delta `* 0.003`
- Fling decay: `velocity *= Math.exp(-dt * 5)`

**Mesh density** — `buildTerrain(elevations, compact.matches ? 321 : 513)`. Desktop uses the full 513 samples; viewports under 900px use 321. The heightmap file stays 513×513 either way.

Camera limits and the grid’s extent are constants `mountain.js` imports from `mountain-geometry.js`:

| Constant | Value | Effect |
| --- | --- | --- |
| `INITIAL_YAW` | `-0.7` | Opening yaw, and the Home-key reset |
| `INITIAL_PITCH` | `π/12` | Opening pitch |
| `MIN_PITCH` | `π/18` | Lowest drag / ArrowDown pitch |
| `MAX_PITCH` | `π/5` | Highest drag / ArrowUp pitch |
| `GRID_HALF` | `4.45` | How far the ground plane reaches |
| `buildGrid(divisions = 28)` | 28 | Cells along each side of the grid |
