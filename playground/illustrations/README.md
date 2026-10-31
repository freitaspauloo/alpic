# Tracks illustrations

Four interactive isometric figures for the Tracks design trial. Each one is a single HTML file: a textbook plate, an isometric line drawing, and a part you can press. The lower-right caption is a live readout.

The drawings use the Iso Figure projection (flat shapes on a plane matrix, hairline strokes). The palette is the wireframe plate Paulo described: near-black `#171A1B`, off-white lines, one mint accent `#5FD39A`, outline crystals, and small mint particles. No heavy fills.

| Fig | File | Press | Readout |
| --- | --- | --- | --- |
| 1 Experiment | `experiment.html` | The tools switch. Keys `T`, `A`, `B`, `C` | `with tools · pass 3/3` or `without tools · pass 1/3` |
| 2 Sandbox | `sandbox.html` | The run key. `Enter` | `idle` → clone → prompt → `passed · 14s · evidence 3` |
| 3 Library | `library.html` | A drawer. Keys `1`–`4` | `open · skills · 3 files` |
| 4 Getting started | `getting-started.html` | The crystal or the plate. `Enter` | `empty · no scenarios`, then the first questions |

`svg/` holds a resting-state export of each plate (captions included) for Figma. On the page, **Save SVG** writes the current state, including whatever the readout says after you press something.

## Run it

From the repo root:

```sh
npm run illustrations
```

Then open http://127.0.0.1:4175.

The gallery is `index.html`. Open any figure directly, for example http://127.0.0.1:4175/experiment.html. The files also run from disk (`file://`); they do not load a library.

Nothing to install. `npm run illustrations` is the same static server as the mountain playground (`scripts/serve-static.mjs`), on port 4175.
