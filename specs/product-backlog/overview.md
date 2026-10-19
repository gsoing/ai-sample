# Office Quotes — Product Backlog Overview

## Product Vision

Office Quotes shows funny or memorable quotes from colleagues on a display page (`/`). Anyone can submit a quote (`/submit`); a moderator approves or rejects it (`/moderate`, not linked). It is a training project for agentic development: anonymous by design (ADR-002), no test runner (ADR-001), local only.

Current epic: **Report a Quote**. Readers can send an approved quote back to moderation; moderators see why it came back; a re-approved quote is immune to further reports. Source documents:

- PRD: `specs/prd/2026-10-19-1802-report-quote-prd.md` (Approved, v1.1)
- Journeys: `specs/user-journeys/2026-10-19-1802-report-quote-journeys.md`
- Story map: `specs/story-maps/2026-10-19-1802-report-quote-story-map.md`

## Phase Status

| Phase | Status | Story IDs | Story Points | Maturity Tier |
|-------|--------|-----------|--------------|---------------|
| Report a Quote — report loop | Backlog | US-zdeix | 5 | Foundation |
| Report a Quote — abuse guard | Backlog | US-csxzd | 3 | Foundation |
| **Total** | | **2 stories** | **8** | |

**Release condition:** US-zdeix and US-csxzd ship together (PRD v1.1). US-zdeix alone lets any reader hide every approved quote.

**Gate before Sprint:** ADR-003 and ADR-004 were `Proposed` at refinement. Both are now `Accepted`, on the Product Manager's instruction (2026-10-19), so the gate is open.

## Timeline Estimates

- 8 points, about 2 to 3 days for one developer, including manual verification.
- Order: US-zdeix, then US-csxzd, then one release.

## Maturity-Tier Mix

- Both stories: **Foundation**, with honest downgrades.
- Foundation guidelines exercised: `DEV-CODE-BP01`, `DEV-CODE-BP02`, `DEV-CODE-BP05`, `DEV-CODE-BP06`, `DEV-TEST-BP01`, `DEV-PLAN-BP01`.
- Growth / Excellence guidelines touched but not adopted (`dso-foundation` only): `DEV-PLAN-BP03` (no OpenAPI), `DEV-SEC-BP01` (identity, derogated by ADR-002).

## DSO Coverage

| Rule | Severity in stories | Status |
|---|---|---|
| DEV-CODE-BP06-R06, R01, R07 | MUST | Satisfied: `problem()`, explicit branches, global and page error boundaries |
| DEV-CODE-BP06-R03 | MUST | Satisfied: nothing sensitive logged |
| DEV-CODE-BP01-R01 | MUST | Satisfied by ADR-003 (Accepted) |
| DEV-CODE-BP05-R01 | MUST | Conventional Commits |
| DEV-PLAN-BP01-R01 | MUST | AGENTS.md updated with the new fields in the same PRs |
| DEV-CODE-BP01-R03, BP02-R03, BP05-R03 | SHOULD | Satisfied |
| DEV-CODE-BP02-R01, R02; DEV-TEST-BP01-R01, R02 | SHOULD | **Downgraded by ADR-001** (no test runner) |
| DEV-CODE-BP06-R02, R04, R05 | SHOULD | **Downgraded by ADR-004** (no structured logging) |
| DEV-SEC-BP01-R02 (identity) | n/a | **Derogated by ADR-002** |

## ADRs

| ADR | File | Status |
|---|---|---|
| ADR-001 No test runner | `docs/adrs/2026-10-19-1552-no-test-runner.md` | Accepted |
| ADR-002 No authentication | `docs/adrs/2026-10-19-1553-no-authentication.md` | Accepted |
| ADR-003 Report data model and abuse bound | `docs/adrs/2026-10-19-1815-report-quote-data-model.md` | Accepted |
| ADR-004 No structured logging | `docs/adrs/2026-10-19-1816-no-structured-logging.md` | Accepted |

## Technical Architecture

Fixed (AGENTS.md): Vite + React 19 (`apps/web`), Express 5 (`apps/api`), MongoDB 8 via the official driver. This epic adds no dependency, no collection and no status value: two optional fields on `quotes` (`report`, `reportClearedAt`), one route (`POST /api/quotes/:id/report`), two problem kinds (`invalid-report`, `quote-not-reportable`).

## Development Notes

- Read `standards/code/error-shape.md` before editing `apps/api/src/`.
- Errors only through `problem()`; the frontend reads `detail`.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm build` before declaring a story done; verification is manual (`curl`, browser).
- Implement with `/spec-driven:implement <STORY_ID>`.
