---
local_id: US-csxzd
jira_key: ""
title: "A re-approved quote can't be reported again"
epic: "Report a Quote"
priority: High
status: Backlog
story_points: 3

maturity_tier: Foundation
stack_context:
  languages: [typescript]
  contexts: [backend, frontend]
  project_types: [monolith]

dso_rules:
  - id: DEV-CODE-BP06-R06
    severity: MUST
    note: "The cleared-quote refusal is a 409 quote-not-reportable Problem Details built with problem(); standard code/error-shape"
  - id: DEV-CODE-BP06-R01
    severity: MUST
    note: "The cleared case is handled explicitly with its own detail, distinct from the not-approved case"
  - id: DEV-CODE-BP06-R07
    severity: MUST
    note: "Web boundary: unreadable or blocked localStorage never breaks the display page"
  - id: DEV-CODE-BP06-R03
    severity: MUST
    note: "No new log line; nothing about the reader is stored server-side"
  - id: DEV-CODE-BP01-R01
    severity: MUST
    note: "reportClearedAt and the one-shot immunity are the abuse bound decided in ADR-003"
  - id: DEV-CODE-BP05-R01
    severity: MUST
    note: "Conventional Commits, one commit per AC, footer Closes US-csxzd"
  - id: DEV-PLAN-BP01-R01
    severity: MUST
    note: "AGENTS.md is updated in the same PR to document the `reportClearedAt` field"
  - id: DEV-CODE-BP02-R01
    severity: SHOULD
    note: "Downgraded by ADR-001: no coverage measured"
  - id: DEV-CODE-BP02-R02
    severity: SHOULD
    note: "Downgraded by ADR-001: lint, typecheck and build run by hand"
  - id: DEV-TEST-BP01-R01
    severity: SHOULD
    note: "Downgraded by ADR-001: curl and browser checks"
  - id: DEV-TEST-BP01-R02
    severity: SHOULD
    note: "Downgraded by ADR-001: no CI"
  - id: DEV-CODE-BP06-R02
    severity: SHOULD
    note: "Downgraded by ADR-004"
  - id: DEV-CODE-BP06-R04
    severity: SHOULD
    note: "Downgraded by ADR-004"
  - id: DEV-CODE-BP06-R05
    severity: SHOULD
    note: "Downgraded by ADR-004"
  - id: DEV-CODE-BP01-R03
    severity: SHOULD
    note: "ADR-003 Security Implications covers the immunity and its permanence"
  - id: DEV-CODE-BP02-R03
    severity: SHOULD
    note: "Extend the US-zdeix report filter and the approve update; no new route"
  - id: DEV-CODE-BP05-R03
    severity: SHOULD
    note: "reportClearedAt follows createdAt / reportedAt naming"

dependencies:
  depends_on: [US-zdeix]
  blocks: []

related_adrs:
  - docs/adrs/2026-10-19-1815-report-quote-data-model.md
  - docs/adrs/2026-10-19-1553-no-authentication.md
  - docs/adrs/2026-10-19-1552-no-test-runner.md
  - docs/adrs/2026-10-19-1816-no-structured-logging.md
---

# US-csxzd: A re-approved quote can't be reported again

## User Story

**As a** moderator
**I want** a quote I re-approved after a report to stay on the display page
**So that** nobody can hide the same quote again and again, and my decision holds

---

## Business Rules

- **Release condition:** this story ships **together with US-zdeix**. It is the guard that makes the report loop safe to release (PRD v1.1).
- Approving a quote that has a `report` removes `report` and sets `reportClearedAt` to the server time, **in one update**. Approving a quote without `report` sets nothing new: a plain submission never gets `reportClearedAt`.
- The report route accepts a quote only if it is `approved` **and** has no `reportClearedAt`. The check is part of the same conditional update as in US-zdeix, so it stays race-safe.
- A report on a cleared quote returns 409 `quote-not-reportable` with a `detail` that says the quote was already reviewed after a report. It is distinguishable from the "not approved" detail of US-zdeix.
- Immunity is permanent (ADR-003). There is no way to un-clear a quote from the app.
- `reportClearedAt` is never exposed by `GET /api/quotes` (FR-5). It is not needed on `GET /api/quotes/pending` either, since a cleared quote is approved.
- The browser remembers the ids this reader has reported successfully (best effort, `localStorage`) and doesn't offer **Report** on those quotes. This is a convenience, not a control: the server rule above is the control.

---

## Scope

### ✅ In Scope
- Approve path: set `reportClearedAt` and unset `report` when a report is present.
- Report route: refuse cleared quotes with a 409 and a dedicated `detail`.
- Display page: show the 409 `detail`; keep a local "reported by me" list and hide **Report** for those ids.
- AGENTS.md: document `reportClearedAt`.

### ❌ Out of Scope
- Un-clearing a quote, report history, counts (PRD section 7).
- Hiding **Report** for quotes cleared by someone else: the public API doesn't say which quotes are cleared (FR-5), so the reader learns it from the 409 message.
- Rate limiting or identity (ADR-002, ADR-003).

---

## DSO Compliance

| Rule ID | Severity | How this story addresses it |
|---------|----------|-----------------------------|
| DEV-CODE-BP06-R06 | MUST | The cleared refusal reuses the `quote-not-reportable` kind through `problem()`. |
| DEV-CODE-BP06-R01 | MUST | Cleared and not-approved are two handled branches with distinct `detail`. |
| DEV-CODE-BP06-R07 | MUST | `localStorage` access is guarded; failures fall back to "nothing remembered". |
| DEV-CODE-BP06-R03 | MUST | No logging added; nothing about the reader goes to the server. |
| DEV-CODE-BP01-R01 | MUST | Implements the immunity decided in ADR-003. |
| DEV-CODE-BP05-R01 | MUST | Conventional Commits. |
| DEV-PLAN-BP01-R01 | MUST | AGENTS.md updated in the same PR (`reportClearedAt`). |
| DEV-CODE-BP02-R01 / R02 | SHOULD (ADR-001) | Manual verification; lint, typecheck, build. |
| DEV-TEST-BP01-R01 / R02 | SHOULD (ADR-001) | `curl` and browser checks per AC. |
| DEV-CODE-BP06-R02 / R04 / R05 | SHOULD (ADR-004) | Not satisfied project-wide. |
| DEV-CODE-BP01-R03 | SHOULD | ADR-003 Security Implications. |
| DEV-CODE-BP02-R03 | SHOULD | Extends existing filters; no new route. |
| DEV-CODE-BP05-R03 | SHOULD | Naming check below. |

**Not applicable here:** `DEV-SEC-BP01-R02` is derogated by ADR-002. `DEV-PLAN-BP03` is Growth and no endpoint is added.

---

## Architecture Decision

- [ ] No ADR needed.
- [x] ADR required → `docs/adrs/2026-10-19-1815-report-quote-data-model.md` (ADR-003), same ADR as US-zdeix. Status **Proposed**: it must be `Accepted` before this story moves to `sprint/`. ADR-004 (**Proposed**) likewise.

---

## Acceptance Criteria

### Criterion 1 — Re-approving a reported quote clears it and makes it immune `[MUST]`

**Given** a quote `X` that was reported (status `pending`, `report` present)
**When** the moderator approves it (`PATCH /api/quotes/X/approve`)
**Then** `X` has `status: "approved"`, no `report`, and a `reportClearedAt` date
**And** `X` is back on `GET /api/quotes`, whose items still have exactly `id`, `text`, `author`, `context`

**Test assertion:** report then approve with `curl`; check the document in `mongosh`; `curl localhost:3000/api/quotes | jq '.[0] | keys'`.

**DSO traceability:** DEV-CODE-BP01-R01 (ADR-003).

### Criterion 2 — A plain approval sets no immunity `[MUST]`

**Given** a fresh pending submission `Y` that was never reported
**When** the moderator approves it
**Then** `Y` is `approved` and has **no** `reportClearedAt`
**And** `Y` can be reported afterwards (US-zdeix AC 1 behaviour)

**Test assertion:** submit, approve, check `mongosh` for no `reportClearedAt`; then report `Y` with `curl` → 200.

**DSO traceability:** DEV-CODE-BP01-R01 (ADR-003: immunity only after a report). DEV-CODE-BP06-R01.

### Criterion 3 — Reporting a cleared quote is refused `[MUST]`

**Given** a quote `X` with `reportClearedAt`
**When** a client sends `POST /api/quotes/X/report` with a valid reason
**Then** the response is `409`, `Content-Type: application/problem+json`, `type: /errors/quote-not-reportable`, and a `detail` that says the quote was already reviewed after a report
**And** this `detail` differs from the one for a pending or rejected quote
**And** `X` stays `approved` and on `GET /api/quotes`
**And** repeating the call any number of times gives the same 409

**Test assertion:** loop `curl` five times and check every status; check `X` is still in `GET /api/quotes`. Code review: the cleared check is inside the conditional update filter, not a separate read before the write.

**DSO traceability:** DEV-CODE-BP06-R06, DEV-CODE-BP06-R01, standard `code/error-shape`.

### Criterion 4 — The display page explains the refusal and remembers this reader's reports `[MUST]`

**Given** the reader is on `/`
**When** they report a quote that is cleared
**Then** the `detail` of the 409 is shown in a `role="alert"` message and the quote stays in the rotation
**When** they report a quote successfully
**Then** its id is remembered in the browser, and after a reload, if the quote is shown again (for example after a moderator re-approved it), **Report** is not offered on it
**And** if `localStorage` is unavailable or holds invalid data, the page works as if nothing was remembered

**Test assertion:** browser: report, have the moderator re-approve, reload `/`, cycle to the quote and see no Report button; then clear site data and see the button back. Block storage (private window or DevTools) and check the page still loads and reporting still works.

**DSO traceability:** DEV-CODE-BP06-R07 (web error boundary), DEV-CODE-BP06-R06 (frontend reads `detail`).

### Criterion 5 — Quality gates pass `[SHOULD]`

**Given** the story is implemented
**When** the developer runs `pnpm lint`, `pnpm typecheck` and `pnpm build`
**Then** all three pass

**Test assertion:** command output in the PR description.

**DSO traceability:** DEV-CODE-BP02-R02, DEV-TEST-BP01-R01/R02, downgraded by ADR-001.

---

## Error & Logging Contract

### Error responses

| Case | Status | `type` | `detail` (indicative) |
|---|---|---|---|
| Quote has `reportClearedAt` | 409 | `/errors/quote-not-reportable` | Quote was already reviewed after a report |
| Quote is `pending` or `rejected` | 409 | `/errors/quote-not-reportable` | Quote is `<status>`, only approved quotes can be reported (US-zdeix) |

Both through `problem()`, `application/problem+json`, fields `type`, `title`, `status`, `detail`, `instance`. No new kind is added: the `title` stays stable for the `type`, and only `detail` changes.

### Structured logs
Not satisfied project-wide (ADR-004). No log line added.

### Trace propagation
Not satisfied project-wide (ADR-004). No outbound call.

### PII / sensitive data
Nothing about the reader is sent or stored server-side. The local list holds quote ids only. Nothing is logged.

---

## API Contract

- **Endpoints touched:**
  - `POST /api/quotes/:id/report`: **changed behaviour**. Also refuses cleared quotes with 409. Response shapes unchanged.
  - `PATCH /api/quotes/:id/approve`: **changed behaviour**. Sets `reportClearedAt` when a report was present. Response unchanged.
  - `GET /api/quotes`, `GET /api/quotes/pending`: **unchanged**. `reportClearedAt` is not exposed.
- **OpenAPI artefact:** none in the project (`DEV-PLAN-BP03` is Growth). Contract documented here and in AGENTS.md.
- **Breaking change classification (semver):**
  - `[x]` Patch — behaviour tightening on a route introduced in the same release, no shape change
  - `[ ]` Minor
  - `[ ]` Major

---

## Security Considerations

- **Secrets touched:** none.
- **Dependency changes:** none.
- **Authentication / authorisation:** unchanged, open routes (ADR-002).
- **Threat model notes:**
  1. **Mass reporting.** After this story, each quote can be hidden by a report at most once (ADR-003). A loop's second pass gets only 409s on cleared quotes.
  2. **Client-side flag tampering.** Clearing or editing `localStorage` only brings the Report button back; the server still refuses cleared quotes. No trust is placed in the client.
  3. **Permanent immunity.** A legitimate later report is refused. Accepted in ADR-003; the fallback is a manual database edit.

---

## Naming Conventions Check

- Mongo field: `reportClearedAt` (lowerCamelCase, date, same suffix as `createdAt` and `reportedAt`).
- `localStorage` key: one kebab-case, app-prefixed key (for example `office-quotes:reported-ids`).
- Functions: lowerCamelCase, for example a pair of `loadReportedIds` / `rememberReportedId` helpers.
- No new path segment, no new problem kind.

---

## Test Contract

- **Unit / integration / E2E:** none automated (ADR-001). Manual checks per AC.
- **Coverage delta target:** not measured (ADR-001).
- **Pre-commit / CI:** none (ADR-001). Lint, typecheck and build by hand (AC 5).
- **Regression:** re-run US-zdeix ACs 1, 2 and 5 after this change, since the report filter and the approve path are shared.

---

## Technical Implementation

### Implementation Summary

Tighten the two paths that US-zdeix introduced. The approve path becomes a single update that, only when `report` is present, unsets it and stamps `reportClearedAt` (a pipeline-style update, or a conditional first update, so that a plain approval sets nothing). The report filter adds "no `reportClearedAt`", and the fallback read that picks the error now has three outcomes. The display page gains a small local list of reported ids.

### Files to Create
- None. If the `localStorage` helpers grow beyond a few lines, `apps/web/src/lib/reported.ts` next to `cycle.ts`.

### Files to Modify
- `apps/api/src/types.ts` — optional `reportClearedAt` on `Quote`.
- `apps/api/src/routes/quotes.ts` — approve path stamps `reportClearedAt` only when reported; report filter excludes cleared quotes; error selection distinguishes cleared from not-approved.
- `apps/web/src/pages/DisplayPage.tsx` — show the 409 `detail`, keep the quote in rotation on refusal, read and write the reported-ids list, hide Report on remembered ids.
- `AGENTS.md` — document `reportClearedAt` in "Office Quotes".

### Files to Delete
- None.

### Implementation Approach

**Step 1: Approve path (AC 1, 2)**
- Keep the existing `moderate()` contract (same responses, same 404/409 errors).
- Make the approve update conditional on the presence of `report`, without a read-then-write race: either one aggregation-pipeline update, or two filtered updates where the second only runs if the first matched nothing.

**Step 2: Report filter (AC 3)**
- Add the "no `reportClearedAt`" condition to the existing conditional update filter.
- On no match, read once: absent gives 404; `reportClearedAt` present gives the cleared 409; otherwise the not-approved 409.

**Step 3: Display page (AC 4)**
- Wrap every `localStorage` read and write in a try/catch; treat parse errors as an empty list.
- Only store an id after a 200.

**Step 4: Verification (AC 5)**
- Manual checks per AC, then re-run US-zdeix ACs 1, 2 and 5.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`; `standards-check` on the diff.

**Step 5: Commit strategy**
- One commit per AC: `feat(api): ...` for AC 1–3, `feat(web): ...` for AC 4, `docs: ...` for AGENTS.md.
- Footer: `Closes US-csxzd`, `Refs: DEV-CODE-BP06-R06`.
- Branch per the implementation skill: `feature/{STORY_ID}-report-immunity`.

---

## Definition of Done

- [ ] US-zdeix is done (dependency)
- [ ] ADR-003 and ADR-004 are `Accepted` before the story moves to `sprint/` (DEV-CODE-BP01-R01)
- [ ] All `[MUST]` ACs (1–4) pass, with evidence in the PR description
- [ ] AC 5 passes (DEV-CODE-BP02-R02, SHOULD per ADR-001)
- [ ] US-zdeix ACs 1, 2 and 5 re-checked after this change (regression)
- [ ] Coverage: not measured, per ADR-001
- [ ] `standards-check` green for `code/error-shape` (DEV-CODE-BP06-R06)
- [ ] `GET /api/quotes` shape unchanged; `reportClearedAt` never exposed
- [ ] AGENTS.md documents `reportClearedAt` (DEV-PLAN-BP01-R01)
- [ ] No sensitive data logged (DEV-CODE-BP06-R03)
- [ ] Conventional Commits with `Closes US-csxzd` (DEV-CODE-BP05-R01)
- [ ] No secrets, no new dependency
- [ ] Released together with US-zdeix (release condition)
- [ ] PR reviewed by a Dev Reviewer who is neither the PM nor the agent on this story
- [ ] Story file moved `sprint/ → done/` after merge
