# Office Quotes

A small site for sharing memorable things people said at the office.

This repository is the starter project for the agentic development training. You build the features with an AI coding agent (Claude Code), one lab at a time. The `main` branch is the baseline: no features yet.

## Stack

- **Frontend**: Vite + React 19 + TypeScript (`apps/web`)
- **Backend**: Express 5 + TypeScript (`apps/api`)
- **Storage**: MongoDB 8 through the official `mongodb` driver, run with Docker Compose
- **Tooling**: pnpm workspace, oxlint for the web app

There is no ORM, validation library, UI library or test runner. `react-router` is the only dependency that may be added.

## Features (built during the labs)

| Feature | Route | Description |
|---|---|---|
| Display | `/` | Shows approved quotes in a random cyclic order |
| Submit | `/submit` | Anyone can submit a quote. It starts as `pending` |
| Moderate | `/moderate` | Moderators move a quote from `pending` to `approved` or `rejected` |

## Getting started

Requirements: Node.js 22+, pnpm 10.5.2, Docker.

```bash
pnpm install
cp .env.example .env
pnpm db:up        # start MongoDB and wait for its healthcheck
pnpm dev          # web on http://localhost:5173, API on http://localhost:3000
```

Check the API and database:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","db":true}
```

Stop the database with `pnpm db:down`. Add `-v` to wipe its data.

## Scripts

Run from the repository root:

| Command | What it does |
|---|---|
| `pnpm dev` | Runs the web and API apps in parallel |
| `pnpm dev:web` / `pnpm dev:api` | Runs one app |
| `pnpm lint` | Lints the web app (oxlint) |
| `pnpm typecheck` | Type-checks the API |
| `pnpm build` | Builds both apps |
| `pnpm db:up` / `pnpm db:down` | Starts or stops MongoDB |

## Repository layout

```
apps/
  web/    Vite + React frontend (entry: src/main.tsx)
  api/    Express API (entry: src/index.ts, routes under /api)
compose.yaml   MongoDB service
AGENTS.md      Instructions for AI coding agents
```

The Vite dev server proxies `/api` to `http://localhost:3000`, so the frontend calls relative `/api/...` URLs.

## Working with AI agents

[`AGENTS.md`](./AGENTS.md) holds the project rules that agents must follow: pnpm only, the fixed architecture, and the gotchas (NodeNext `.js` imports, MongoDB auth, and so on). Keep it up to date when the project changes.
