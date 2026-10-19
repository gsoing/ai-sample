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
- A reader can report an approved quote (`POST /api/quotes/:id/report`, `reason` one of `offensive`, `inaccurate`, `private-info`, `other`). The quote goes back to `pending` and gets an optional `report` field (`{ reason, reportedAt }`), returned only by `GET /api/quotes/pending`. Approving a reported quote removes `report` and sets `reportClearedAt`: from then on the quote can't be reported again (409 `quote-not-reportable`). `reportClearedAt` is never returned by the API. See ADR-003 (`docs/adrs/2026-10-19-1815-report-quote-data-model.md`).

## API conventions
- Error responses are RFC 9457 Problem Details served as `application/problem+json`: `{ type, title, status, detail }` (standard `code/error-shape`, rule `DEV-CODE-BP06-R06`). Build them with `problem()` from `apps/api/src/problem.ts`, never by hand. Each kind of error has one stable `type` (`/errors/<kind>`) and one `title`; add new kinds in that file.
- `GET /api/health` is not an error response: it keeps its monitoring body `{ status, db }`, including on 503.
- The frontend reads the error message from `detail`.
- Validation limits for a quote: `text` 1 to 280 characters, `author` 1 to 60, `context` up to 200. Strings are trimmed.
- New quotes are always created as `pending`; the client cannot set `status`.
- One route file per resource under `apps/api/src/routes/`, mounted in `src/index.ts`.

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
