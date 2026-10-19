---
local_id: US-zdeix
jira_key: ""
title: "Report a quote back to moderation"
epic: "Report a Quote"
priority: High
status: Sprint
story_points: 5

maturity_tier: Foundation
stack_context:
  languages: [typescript]
  contexts: [backend, frontend]
  project_types: [monolith]

dso_rules:
  - id: DEV-CODE-BP06-R06
    severity: MUST
    note: "Every new error (400 invalid id, 400 invalid report, 404, 409) is RFC 9457 Problem Details built with problem(); standard code/error-shape"
  - id: DEV-CODE-BP06-R01
    severity: MUST
    note: "Each failure of the report route is handled explicitly with a specific type and a detail; unexpected errors fall through to the global handler"
  - id: DEV-CODE-BP06-R07
    severity: MUST
    note: "API boundary: global error handler in index.ts. Web boundary: the display page catches fetch failures and shows a message instead of breaking"
  - id: DEV-CODE-BP06-R03
    severity: MUST
    note: "No request body or report reason is logged; the route adds no log line"
  - id: DEV-CODE-BP01-R01
    severity: MUST
    note: "Schema change (optional report sub-document) and the abuse trade-off are recorded in ADR-003"
  - id: DEV-CODE-BP05-R01
    severity: MUST
    note: "Conventional Commits, one commit per AC, footer Closes US-zdeix"
  - id: DEV-PLAN-BP01-R01
    severity: MUST
    note: "AGENTS.md is updated in the same PR to document the `report` field"
  - id: DEV-CODE-BP02-R01
    severity: SHOULD
    note: "Downgraded by ADR-001: no test runner, so no coverage figure; ACs are verified by hand"
  - id: DEV-CODE-BP02-R02
    severity: SHOULD
    note: "Downgraded by ADR-001: pnpm lint, typecheck and build pass locally; nothing blocks a merge"
  - id: DEV-TEST-BP01-R01
    severity: SHOULD
    note: "Downgraded by ADR-001: curl and browser checks replace automated test layers"
  - id: DEV-TEST-BP01-R02
    severity: SHOULD
    note: "Downgraded by ADR-001: no CI"
  - id: DEV-CODE-BP06-R02
    severity: SHOULD
    note: "Downgraded by ADR-004: no structured logger in the project"
  - id: DEV-CODE-BP06-R04
    severity: SHOULD
    note: "Downgraded by ADR-004: no trace propagation, single service with no outbound calls"
  - id: DEV-CODE-BP06-R05
    severity: SHOULD
    note: "Downgraded by ADR-004: no log-level configuration"
  - id: DEV-CODE-BP01-R03
    severity: SHOULD
    note: "ADR-003 has a Security Implications section with the threat model of the open report route"
  - id: DEV-CODE-BP02-R03
    severity: SHOULD
    note: "Reuse the id check, problem() and the moderation pattern; no new abstraction"
  - id: DEV-CODE-BP05-R03
    severity: SHOULD
    note: "New identifiers follow the naming check below; the path segment 'report' is kebab-case"

dependencies:
  depends_on: []
  blocks: [US-csxzd]

related_adrs:
  - docs/adrs/2026-10-19-1815-report-quote-data-model.md
  - docs/adrs/2026-10-19-1553-no-authentication.md
  - docs/adrs/2026-10-19-1552-no-test-runner.md
  - docs/adrs/2026-10-19-1816-no-structured-logging.md
---

# US-zdeix: Report a quote back to moderation

## User Story

**As a** reader of the display page
**I want to** report a quote that looks inappropriate, with a reason
**So that** it leaves the screen and a moderator reviews it again

---

## Business Rules

- **Release condition:** this story ships **together with US-csxzd** (PRD v1.1, story map). On its own it is a "hide everything" button. It may be built, reviewed and merged into a feature branch alone, but not released alone.
- A report is accepted only on a quote whose `status` is `approved`.
- `reason` is required and must be exactly one of `offensive`, `inaccurate`, `private-info`, `other`. No free text, no trimming or case folding: anything else is invalid.
- A successful report sets `status` to `pending` and stores `report` (`reason`, `reportedAt` = server time) in the same single conditional update. Two concurrent reports, or a report racing a moderator action, can't both succeed: the loser gets 409.
- `createdAt` is not changed by a report, so the `/moderate` queue order (oldest `createdAt` first) is unchanged.
- Approving a quote removes its `report`. Rejecting it leaves `report` in place (nothing reads it). The immunity flag `reportClearedAt` is **not** part of this story: it comes with US-csxzd.
- `GET /api/quotes` keeps exactly `id`, `text`, `author`, `context`. Report data is never exposed there.

---

## Scope

### ✅ In Scope
- `POST /api/quotes/:id/report` in `apps/api/src/routes/quotes.ts`, with validation and Problem Details errors.
- Two new problem kinds in `apps/api/src/problem.ts`: `invalid-report` (400) and `quote-not-reportable` (409).
- `report` returned by `GET /api/quotes/pending` when present.
- Approve removes `report`.
- Display page: Report button, reason picker with confirm and cancel, success and error messages, reported quote dropped from the local rotation.
- Moderate page: **Reported** badge and readable reason label.
- AGENTS.md: document the optional `report` field and the new route.

### ❌ Out of Scope
- `reportClearedAt` immunity, the 409 for cleared quotes, and the `localStorage` "already reported" flag (US-csxzd).
- Authentication (ADR-002), rate limiting, notifications, report counts, report history, free-text reasons (PRD section 7).
- Reporting from `/moderate` or `/submit`.
- OpenAPI generation (no spec exists in the project; see API Contract).

---

## DSO Compliance

| Rule ID | Severity | How this story addresses it |
|---------|----------|-----------------------------|
| DEV-CODE-BP06-R06 | MUST | All new errors go through `problem()`, `application/problem+json`, with stable `type` per kind. |
| DEV-CODE-BP06-R01 | MUST | Each failure path has its own handled branch: invalid id, invalid reason, not found, not reportable. |
| DEV-CODE-BP06-R07 | MUST | API: unexpected errors reach the global handler. Web: fetch failures caught, message shown, page keeps working. |
| DEV-CODE-BP06-R03 | MUST | Nothing is logged by the new route. |
| DEV-CODE-BP01-R01 | MUST | ADR-003 records the schema change and the abuse trade-off. |
| DEV-CODE-BP05-R01 | MUST | Conventional Commits, one per AC. |
| DEV-PLAN-BP01-R01 | MUST | AGENTS.md updated in the same PR (`report`). |
| DEV-CODE-BP02-R01 / R02 | SHOULD (ADR-001) | No runner; `pnpm lint`, `pnpm typecheck`, `pnpm build` pass; manual verification. |
| DEV-TEST-BP01-R01 / R02 | SHOULD (ADR-001) | `curl` and browser checks listed per AC. |
| DEV-CODE-BP06-R02 / R04 / R05 | SHOULD (ADR-004) | Not satisfied project-wide; nothing added here. |
| DEV-CODE-BP01-R03 | SHOULD | ADR-003 Security Implications. |
| DEV-CODE-BP02-R03 | SHOULD | Reuse existing helpers and patterns. |
| DEV-CODE-BP05-R03 | SHOULD | Naming check below. |

**Not applicable here:** `DEV-SEC-BP01-R02` (identity) is derogated by ADR-002, which covers new write routes. `DEV-PLAN-BP03` is a Growth guideline and the project has no OpenAPI artefact. `DEV-CODE-BP03`/`BP04` are Growth and this story adds no dependency or secret.

---

## Architecture Decision

- [ ] No ADR needed.
- [x] ADR required → `docs/adrs/2026-10-19-1815-report-quote-data-model.md` (ADR-003). Status is **Accepted**, so the gate to `sprint/` is open.

Also linked: ADR-002 (no authentication), ADR-001 (no test runner), ADR-004 (no structured logging, **Accepted**).

---

## Acceptance Criteria

### Criterion 1 — Reporting an approved quote sends it back to moderation `[MUST]`

**Given** an approved quote with id `X`
**When** a client sends `POST /api/quotes/X/report` with body `{ "reason": "offensive" }`
**Then** the response is `200` with `{ "id": "X", "status": "pending" }`
**And** the quote in MongoDB has `status: "pending"` and `report` with `reason: "offensive"` and a `reportedAt` date, and `createdAt` is unchanged
**And** `GET /api/quotes` no longer contains `X`, and its items still have exactly the keys `id`, `text`, `author`, `context`

**Test assertion:** `curl -i -X POST -H 'Content-Type: application/json' -d '{"reason":"offensive"}' localhost:3000/api/quotes/X/report` → 200; `curl localhost:3000/api/quotes | jq '[.[].id] | index("X")'` → `null`; `jq '.[0] | keys'` → `["author","context","id","text"]` (or without `context`). Check the document in `mongosh`.

**DSO traceability:** DEV-CODE-BP01-R01 (ADR-003 data model). Verification method per ADR-001.

### Criterion 2 — Invalid requests are rejected as Problem Details `[MUST]`

**Given** the API is running
**When** a client sends `POST /api/quotes/:id/report` with:
- `:id` not a 24-character hex string → **Then** `400`, `type: /errors/invalid-quote-id`
- a valid id but body missing `reason`, `reason` not a string, or not one of the four values (e.g. `"spam"`, `"Offensive"`) → **Then** `400`, `type: /errors/invalid-report`, `detail` lists the allowed values
- a valid id that matches no quote, with a valid reason → **Then** `404`, `type: /errors/quote-not-found`
- the id of a `pending` or `rejected` quote, with a valid reason → **Then** `409`, `type: /errors/quote-not-reportable`, `detail` says the quote is not approved (with its current status)
**And** every error has `Content-Type: application/problem+json` and the fields `type`, `title`, `status`, `detail`
**And** the quote's data is unchanged in every error case

**Test assertion:** one `curl -i` per row, checking status, content type and `type`. Malformed JSON already returns `400 invalid-json-body` through the global handler; check it once.

**DSO traceability:** DEV-CODE-BP06-R06, DEV-CODE-BP06-R01, standard `code/error-shape`.

### Criterion 3 — Concurrent reports can't both succeed `[MUST]`

**Given** an approved quote `X`
**When** two report requests on `X` arrive at the same time
**Then** exactly one returns `200` and the other `409 quote-not-reportable`
**And** the stored `report` is the one from the successful request

**Test assertion:** fire two `curl` calls in parallel (`& ... & wait`) and check the two statuses. Code review confirms the status check and the write are one conditional `updateOne` filtered on `status: approved`.

**DSO traceability:** DEV-CODE-BP06-R01 (explicit handling of the conflict). ADR-003 (race conditions).

### Criterion 4 — A reader can report from the display page `[MUST]`

**Given** the display page shows an approved quote
**When** the reader clicks **Report**
**Then** a choice of four reasons appears (Offensive, Inaccurate, Private information, Other) with **Confirm** and **Cancel**, and nothing is sent yet
**And** **Cancel** closes the choice without a request
**When** the reader picks a reason and clicks **Confirm**
**Then** a status message (`role="status"`) says the quote has been sent back to moderation
**And** the quote is removed from the local rotation, the next quote is shown, and it does not come back in this page session
**And** if it was the last quote, the page shows "No quotes yet"
**And** if the API returns an error, its `detail` is shown in a `role="alert"` message and the page keeps working; if the server can't be reached, a generic message is shown
**And** the Report button and the reason controls are keyboard-reachable and labelled

**Test assertion:** browser walk-through on `/` with the API and MongoDB running; network tab shows one `POST .../report` only after Confirm; reload `/` in another tab and the quote is gone. Stop the API and confirm to see the generic error.

**DSO traceability:** DEV-CODE-BP06-R07 (web error boundary), DEV-CODE-BP06-R06 (frontend reads `detail`, AGENTS.md).

### Criterion 5 — Moderators see why a quote came back, and the existing flow still works `[MUST]`

**Given** a quote `X` was reported with reason `private-info`
**When** the moderator opens `/moderate`
**Then** `GET /api/quotes/pending` returns `X` with `report: { reason: "private-info", reportedAt }`, and quotes never reported have no `report` key
**And** the card for `X` shows a **Reported** badge and the label "Private information"
**When** the moderator clicks **Approve** on `X`
**Then** `X` is `approved`, has no `report` field, and is back on `GET /api/quotes`
**When** the moderator clicks **Reject** on another reported quote
**Then** it is `rejected` and never shown on `/`
**And** approving and rejecting a quote that was never reported behaves exactly as before (regression)

**Test assertion:** `curl localhost:3000/api/quotes/pending | jq` before and after; browser check of the badge; `mongosh` check that `report` is gone after Approve; approve and reject one plain submission.

**DSO traceability:** DEV-CODE-BP01-R01 (ADR-003: `report` cleared on Approve). DEV-CODE-BP02-R03 (reuse the existing moderation flow).

### Criterion 6 — Quality gates pass `[SHOULD]`

**Given** the story is implemented
**When** the developer runs `pnpm lint`, `pnpm typecheck` and `pnpm build` from the repo root
**Then** all three pass

**Test assertion:** command output in the PR description.

**DSO traceability:** DEV-CODE-BP02-R02, DEV-TEST-BP01-R01/R02, DEV-CODE-BP02-R01, all downgraded by ADR-001.

---

## Error & Logging Contract

### Error responses
All errors of the new route are RFC 9457 Problem Details, built with `problem()` (`type`, `title`, `status`, `detail`, `instance`), content type `application/problem+json`.

| Case | Status | `type` | `title` | Kind |
|---|---|---|---|---|
| Id not 24-hex | 400 | `/errors/invalid-quote-id` | Invalid quote id | existing |
| Body not an object, `reason` missing or not one of the four values | 400 | `/errors/invalid-report` | Invalid report | **new** |
| No quote with this id | 404 | `/errors/quote-not-found` | Quote not found | existing |
| Quote is `pending` or `rejected` (or lost a race) | 409 | `/errors/quote-not-reportable` | Quote not reportable | **new** |
| Malformed JSON | 400 | `/errors/invalid-json-body` | Invalid JSON body | existing, global handler |
| Unexpected error | 500 | `/errors/internal` | Internal server error | existing, global handler |

### Structured logs
Not satisfied project-wide: the API uses console logging (ADR-004, `DEV-CODE-BP06-R02/R05` downgraded to SHOULD). This story adds no log line. Unexpected errors are logged by the existing global error handler (method, URL, error).

### Trace propagation
Not satisfied project-wide (ADR-004, `DEV-CODE-BP06-R04` SHOULD). The route makes no outbound call.

### PII / sensitive data
The route handles a quote id and a reason from a closed list. Neither is logged. Quote text is never logged. (`DEV-CODE-BP06-R03`, MUST.)

---

## API Contract

- **Endpoints touched:**
  - `POST /api/quotes/:id/report`: **new**. Request body: `{ reason: "offensive" | "inaccurate" | "private-info" | "other" }`. Response `200`: `{ id, status: "pending" }`. Errors: see table above.
  - `GET /api/quotes/pending`: **changed, additive**. Items may now carry `report: { reason, reportedAt }` (ISO date string).
  - `PATCH /api/quotes/:id/approve`: **changed behaviour**. Also removes `report`. Response unchanged.
  - `GET /api/quotes`: **unchanged**, and must stay so.
- **OpenAPI artefact:** none. The project has no OpenAPI spec; `DEV-PLAN-BP03` is a Growth guideline, outside the `dso-foundation` opt-in. The contract is documented here and in AGENTS.md.
- **Breaking change classification (semver):**
  - `[ ]` Patch
  - `[x]` Minor — additive (new endpoint, new optional field on a response)
  - `[ ]` Major

---

## Security Considerations

- **Secrets touched:** none.
- **Dependency changes:** none.
- **Authentication / authorisation:** the new write route is open to anyone, like every route (ADR-002 derogation, which covers future write routes). Abuse trade-off in ADR-003.
- **Threat model notes:**
  1. **Mass reporting (denial of content).** One loop can hide every approved quote once. Partly mitigated here (a pending quote can't be re-reported); fully bounded only with US-csxzd's immunity, hence the release condition.
  2. **Injection.** The id is validated as 24-hex before `new ObjectId`; `reason` is compared against a closed list, so no user string reaches a query operator or the database.
  3. **Data exposure.** `GET /api/quotes` projection unchanged; report data only on the pending route (as open as `/moderate`, ADR-002).

---

## Naming Conventions Check

- Path segment: `report` (kebab-case, verb-style action like the existing `approve` and `reject`).
- Problem kinds: `invalid-report`, `quote-not-reportable` (kebab-case, like the existing kinds).
- Mongo fields: `report`, `reason`, `reportedAt` (lowerCamelCase, like the existing `createdAt`; the collection itself stays `quotes`).
- Reason values: `offensive`, `inaccurate`, `private-info`, `other` (kebab-case strings).
- Functions and types: lowerCamelCase / UpperCamelCase, for example a `validateReport` function and a `QuoteReport` type, following `validateNewQuote` and `Quote`.
- Constants: follow the file's existing style (e.g. `TEXT_MAX`).

---

## Test Contract

- **Unit / integration / E2E:** none automated. No test runner (ADR-001). Each AC lists its manual check: `curl` and `mongosh` for the API, a browser walk-through for the web pages.
- **Coverage delta target:** not measured (ADR-001, `DEV-CODE-BP02-R01` SHOULD).
- **Pre-commit / CI:** none (ADR-001). `pnpm lint`, `pnpm typecheck`, `pnpm build` are run by hand (AC 6).
- **Regression:** approving and rejecting a never-reported quote, and loading `/` and `/submit`, are re-checked by hand (AC 5).

---

## Technical Implementation

### Implementation Summary

Add a report action next to the existing moderation actions in the quotes router, following the same shape as the existing `moderate()` helper: validate the id, try one conditional update, and on no match read the document once to choose between 404 and 409. Extend the pending projection and the approve path. On the web side, add the report interaction to the display page and a badge to the moderate page.

### Files to Create
- None.

### Files to Modify
- `apps/api/src/types.ts` — add the report reason union and the optional `report` field on `Quote`.
- `apps/api/src/validation.ts` — add a report body validator returning the same `ok`/`error` result shape as `validateNewQuote`, with the closed list of reasons as a single exported constant.
- `apps/api/src/problem.ts` — add the kinds `invalid-report` (400, "Invalid report") and `quote-not-reportable` (409, "Quote not reportable").
- `apps/api/src/routes/quotes.ts` — add `POST /:id/report`; include `report` in the pending projection; make Approve unset `report`.
- `apps/web/src/pages/DisplayPage.tsx` — Report button, reason picker, confirm and cancel, messages, removal from rotation.
- `apps/web/src/lib/cycle.ts` — only if needed: a way to drop one item from the rotation state without breaking the no-repeat rule.
- `apps/web/src/pages/ModeratePage.tsx` — optional `report` on the pending type; Reported badge with a reason-to-label map.
- `apps/web/src/index.css` — badge and picker styles, in the existing style.
- `AGENTS.md` — "Office Quotes": the optional `report` field; "API conventions": nothing new beyond the kinds living in `problem.ts`.

### Files to Delete
- None.

### Implementation Approach

**Step 1: API contract (AC 1, 2, 3)**
- Read `standards/code/error-shape.md` before editing `apps/api/src/` (CLAUDE.md "Standards").
- Validate the id with the same 24-hex check as `moderate()`, then the body, then run one `updateOne` filtered on `_id` and `status: approved`, setting `status` and `report`.
- On `matchedCount === 0`, read the document once: absent gives 404, otherwise 409 with the current status in `detail`.
- Follow the `add-rest-endpoint` skill conventions (`.js` imports, route in the existing quotes router).

**Step 2: Moderation side (AC 5)**
- Add `report` to the pending projection only when it exists.
- Make the approve path unset `report`. Keep the reject path as it is. Keep the `moderate()` response and error behaviour unchanged.

**Step 3: Display page (AC 4)**
- Keep the existing fetch-on-mount. Hold the picker state locally; send nothing before Confirm.
- On success, remove the quote from both the full list and the rotation state, then move to the next quote.
- Read `detail` from error responses, like `ModeratePage` does.

**Step 4: Moderate page (AC 5)**
- Show the badge and the readable label from a fixed map, never the raw value as HTML.

**Step 5: Verification (AC 6)**
- Run every manual check in the ACs, then `pnpm lint`, `pnpm typecheck`, `pnpm build`.
- Run `pnpm standards:prepare` and the `standards-check` skill on the diff (`code/error-shape`).

**Step 6: Commit strategy**
- One commit per AC, Conventional Commits: `feat(api): ...` for AC 1–3, `feat(web): ...` for AC 4–5, `docs: ...` for AGENTS.md.
- Footer: `Closes US-zdeix` and `Refs: DEV-CODE-BP06-R06` (and other rules satisfied).
- Branch per the implementation skill: `feature/{STORY_ID}-report-quote`.

---

## Definition of Done

- [ ] ADR-003 and ADR-004 are `Accepted` before the story moves to `sprint/` (DEV-CODE-BP01-R01)
- [ ] All `[MUST]` ACs (1–5) pass, with the `curl` output and browser evidence in the PR description
- [ ] AC 6 passes: `pnpm lint`, `pnpm typecheck`, `pnpm build` (DEV-CODE-BP02-R02, SHOULD per ADR-001)
- [ ] Coverage: not measured, per ADR-001 (DEV-CODE-BP02-R01 SHOULD)
- [ ] Every new error goes through `problem()`; `standards-check` on the diff is green for `code/error-shape` (DEV-CODE-BP06-R06)
- [ ] `GET /api/quotes` response shape unchanged (FR-5)
- [ ] AGENTS.md documents the `report` field (DEV-PLAN-BP01-R01)
- [ ] No sensitive data logged; no new log line (DEV-CODE-BP06-R03)
- [ ] All commits follow Conventional Commits with `Closes US-zdeix` (DEV-CODE-BP05-R01)
- [ ] No secrets committed, no new dependency
- [ ] **Not released before US-csxzd is done** (release condition)
- [ ] PR reviewed by a Dev Reviewer who is neither the PM nor the agent on this story
- [ ] Story file moved `sprint/ → done/` after merge
