# AGENTS.md

pnpm workspace (`apps/*`). Use `pnpm` only (pinned `pnpm@10.5.2`, Node >=22); never npm/yarn.

## Context
Example project for learning agentic development. Favor small, readable, conventional code over cleverness or heavy abstraction.

## Architecture (fixed, do not deviate)
- Frontend: Vite + React (`apps/web`), pages routed with `react-router`.
- Backend: Node.js + Express (`apps/api`).
- Storage: MongoDB (local via Docker Compose).
- Do not introduce alternatives (other frameworks, bundlers, or databases/ORMs for storage) or swap these pieces without an explicit request from the user.

## Office Quotes
- The app has 3 pages: `/` (display), `/submit`, `/moderate`. `/moderate` is not linked in the navigation. There is no authentication, by design.
- Quotes live in the `quotes` collection with the fields `text`, `author`, `context`, `status`, `createdAt`.
- `status` is one of `pending`, `approved`, `rejected`. Only `approved` quotes are ever shown on `/`.

## Layout
- `apps/web`: Vite + React 19 + TS (ESM). Entry `src/main.tsx`.
- `apps/api`: Express 5 + TS (ESM). Entry `src/index.ts`, listens on `PORT` (default 3000). Routes live under `/api`.

## Commands (run from repo root)
- `pnpm dev` runs both apps in parallel. `pnpm dev:web` (5173) / `pnpm dev:api` (3000) run one.
- `pnpm lint` -> `pnpm typecheck` -> `pnpm build` before finishing. Root scripts use `pnpm -r --if-present`.
- Single package: `pnpm --filter web <script>` / `pnpm --filter api <script>`.
- `pnpm db:seed` resets the `quotes` collection with demo data (needs MongoDB running).
- `pnpm db:up` starts MongoDB 8 via `compose.yaml` (waits for healthcheck); `pnpm db:down` stops it (data kept in the `mongo-data` volume; add `-v` to wipe).
- No test runner is configured yet.

## Gotchas
- Only `web` has `lint` (oxlint, not ESLint). Only `api` has `typecheck`; `web` typechecks inside `build` (`tsc -b && vite build`).
- `api` uses `module: NodeNext`: relative imports need an explicit `.js` extension (e.g. `import { x } from './routes.js'`). Dev runs via `tsx watch`; prod via `tsc` then `node dist/index.js`.
- Vite dev server proxies `/api` to `http://localhost:3000` (`apps/web/vite.config.ts`). Call the API with relative `/api/...` URLs from the frontend; if you change the API port, update the proxy too.
- The API needs MongoDB running or it exits at startup: `cp .env.example .env && pnpm db:up` first. `src/db.ts` wraps the official `mongodb` driver (no ORM); `src/index.ts` awaits `connectDb()` before listening. `/api/health` returns 503 with `db: false` if Mongo is unreachable.
- Mongo has auth enabled (root user), so the URI needs `?authSource=admin`. `MONGODB_URI` is read from `process.env`, falling back to the `.env.example` default. `.env` (gitignored, at repo root) is loaded via Node's `--env-file-if-exists` in the api `dev`/`start` scripts, not via dotenv.
- pnpm ignores esbuild's postinstall (`pnpm approve-builds` not run); it works as is, so don't "fix" it.
