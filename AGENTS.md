# AGENTS.md

pnpm workspace (`apps/*`). Use `pnpm` only (pinned `pnpm@10.5.2`, Node >=22.13); never npm/yarn.

## Context
Example project for learning agentic development. Favor small, readable, conventional code over cleverness or heavy abstraction.

## Architecture (fixed, do not deviate)
- Frontend: Vite + React (`apps/web`).
- Backend: Node.js + Express (`apps/api`).
- Storage: SQLite via Node's built-in `node:sqlite` (`DatabaseSync`). No ORM, no `better-sqlite3`, no Docker.
- Do not introduce alternatives (other frameworks, bundlers, or databases/ORMs for storage) or swap these pieces without an explicit request from the user.

## Layout
- `apps/web`: Vite + React 19 + TS (ESM). Entry `src/main.tsx`.
- `apps/api`: Express 5 + TS (ESM). Entry `src/index.ts`, listens on `PORT` (default 3000). Routes live under `/api`.

## Commands (run from repo root)
- `pnpm dev` runs both apps in parallel. `pnpm dev:web` (5173) / `pnpm dev:api` (3000) run one.
- `pnpm lint` -> `pnpm typecheck` -> `pnpm build` before finishing. Root scripts use `pnpm -r --if-present`.
- Single package: `pnpm --filter web <script>` / `pnpm --filter api <script>`.
- `pnpm db:reset` deletes the SQLite database (`apps/api/data/`); stop the API first.
- No test runner is configured yet.

## Gotchas
- Only `web` has `lint` (oxlint, not ESLint). Only `api` has `typecheck`; `web` typechecks inside `build` (`tsc -b && vite build`).
- `api` uses `module: NodeNext`: relative imports need an explicit `.js` extension (e.g. `import { x } from './routes.js'`). Dev runs via `tsx watch`; prod via `tsc` then `node dist/index.js`.
- Vite dev server proxies `/api` to `http://localhost:3000` (`apps/web/vite.config.ts`). Call the API with relative `/api/...` URLs from the frontend; if you change the API port, update the proxy too.
- `src/db.ts` wraps `node:sqlite` (synchronous API: `getDb().prepare(sql).get/all/run(...)`); `src/index.ts` calls `connectDb()` before listening. Create tables with `CREATE TABLE IF NOT EXISTS` at startup; there is no migration tool.
- The database file is `apps/api/data/app.db` (gitignored), hardcoded in `src/db.ts` as `data/app.db` relative to `apps/api`, the cwd of the api scripts. There is no `.env` file or config to set up; keep it that way (no dotenv).
- Do not add `better-sqlite3` or any native SQLite binding: pnpm skips build scripts here, so native modules won't compile.
- pnpm ignores esbuild's postinstall (`pnpm approve-builds` not run); it works as is, so don't "fix" it.
