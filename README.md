# alpic

DUDESIGN x Alpic: product design work, starting with Tracks (agent harness and experiments dashboard).

Local studies live under `playground/`. The interactive sign-in mountain is in [`playground/mountain`](playground/mountain/README.md). From the repo root, run `npm run mountain` and open http://127.0.0.1:4173.

The brand trial lives in [`brand`](brand/README.md): the homepage, the brand guide, and the mountain configurator. From `brand/`, run `npm run dev` and open http://127.0.0.1:4174. That port is the same as Tracks, so run one at a time.

The Tracks interface prototypes:

- [`tracks`](tracks/README.md) — from the repo root, run `npm run tracks` and open http://127.0.0.1:4174.
- [`tracks-v2`](tracks-v2) — from the repo root, run `npm run tracks:v2` and open http://127.0.0.1:4175. This is the version meant to deploy as a static Vite app (Vercel root directory `tracks-v2`).
- [`v2`](v2) — a Tavus-paced Tracks flow (homepage, signup, role, tour, then the product). From the repo root, run `npm run v2` and open http://127.0.0.1:4178.
