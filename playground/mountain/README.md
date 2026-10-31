# Alpic mountain

Interactive 3D mountain from the [Alpic sign-in page](https://idp.alpic.ai/sign-in). It is a dependency-free, hand-written WebGL2 renderer: a 513×513 16-bit heightmap (`assets/alpine-massif.bin`) drawn as a pink-and-ice massif on a ground grid. Drag the canvas to orbit it. Arrow keys rotate, Home resets the view, and Space pauses the idle spin.

This is Alpic’s own code and art, copied here for Paulo’s design trial. The renderer is unchanged.

## Run it

From the repo root:

```sh
npm run mountain
```

Then open http://127.0.0.1:4173. Nothing to install: the script is a small static server (`scripts/serve-static.mjs`) with no dependencies. It has to be served over HTTP. `mountain.js` is an ES module, so opening `index.html` as a file will not load the terrain.

Without Node, from the repo root:

```sh
python3 -m http.server 4173 --directory playground/mountain
```

Refresh the page after editing the scripts. There is no build step.

If WebGL or the heightmap fails, the static fallback `assets/alpic-mountain.png` stays on screen and the console warns `Interactive terrain unavailable`.

## What to tweak

Colors, light, and motion live in the fragment shader and the pointer handler in `mountain.js`. Camera defaults and the grid’s extent live in `mountain-geometry.js`, which `mountain.js` imports.

**Ink palette** — `mountain.js`, inside the fragment shader, the `ink = …` assignments. Snow is the ice blues (`vec3(.78,.94,.95)` and the three darker steps, plus the sunlit patch `vec3(.91,.98,.96)` and the sparkle `vec3(1.0,0.99,0.94)`). Rock is the pinks and near-blacks (`vec3(1.0,.47,.51)` down to `vec3(.10,.19,.21)`, with seam colors `vec3(.12,.21,.23)` and `vec3(1.0,.65,.66)`).

**Light direction** — `mountain.js`, the sun vector:

```js
vec3 sun = toLocal(normalize(vec3(-0.85, 0.7, 0.35)));
```

**Grid color** — `mountain.js`, the early-out when `grid == 1`: `vec4(0.18, 0.27, 0.25, 1)`.

**Grid size** — `mountain-geometry.js`. `GRID_HALF` (currently `4.45`) is the half-extent of the square. `buildGrid(divisions = 28)` is how many lines run each way.

**Camera yaw, pitch, and limits** — `mountain-geometry.js`:

| Constant | Value | Role |
| --- | --- | --- |
| `INITIAL_YAW` | `-0.7` | Starting orbit |
| `INITIAL_PITCH` | `Math.PI / 12` | Starting tilt |
| `MIN_PITCH` | `Math.PI / 18` | Lowest tilt |
| `MAX_PITCH` | `Math.PI / 5` | Highest tilt |

`mountain.js` reads these and clamps mouse and arrow-key pitch to the min and max.

**Rotation speeds** — `mountain.js`, in `draw` and the pointer handler:

- Idle spin: `yaw += dt * 0.035`, and only after 2.5s with no interaction (`lastInteraction` / `autoRotate`).
- Drag: yaw moves by `dx * 0.007`. Mouse pitch moves by `dy * 0.003`.
- Coasting after a drag: `velocity` is clamped to ±2 and decays with `Math.exp(-dt * 5)`.

## Files

The page next to this README is a standalone copy of the sign-in screen. `index.html` points at local assets, does not include the OAuth script, and has a blank favicon so the browser does not request `/favicon.ico`. `mountain.js` fetches `./assets/alpine-massif.bin` instead of `/assets/alpine-massif.bin`. `mountain-geometry.js` is identical to the original.

`source/` is the unmodified download from https://idp.alpic.ai/sign-in: `idp-signin.html`, `mountain.js`, `mountain-geometry.js`, `alpine-massif.bin`, and `alpic-mountain.png`. Leave that folder as a reference.
