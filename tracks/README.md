# Tracks prototype

A local rebuild of the [Tracks](https://tracks.alpic.ai/) interface for Paulo’s design trial. Sign-in is simulated. The screens, labels, and sample organization are here so the layout can be changed without the production app.

This is not Alpic’s source. The landing copy, navigation, and page language follow the live product. The data is sample data and stays in this browser tab.

## Run it

From the repo root:

```sh
npm run tracks
```

The first time, install the app’s dependencies:

```sh
npm install --prefix tracks
```

Then open http://127.0.0.1:4174.

Sign in on the landing page opens the Acme organization. Northwind is an empty organization with a $0 balance, so the empty states and the “add funds” block are visible there. Use the organization menu to switch, create an organization, or open the sample invitation.

## What’s in the prototype

- The sidebar is the [AI Sidebar](https://beui.dev/components/agents/ai-sidebar): drag files between projects, rename with F2, and move rows from the keyboard
- Landing page
- Experiments, including a new experiment, import-from-questions, edit, launch, and the latest result
- Runs, filters, a one-off new run, and a run with its prompt and evidence
- Library: repositories, skills, MCP servers, command-line tools
- Analytics: sources (Vercel and Cloudflare) and traffic
- Members, API keys, billing, and settings

Theme, balance, and edits stay in `sessionStorage` until the tab is closed.
