# Story Map: Report a Quote

**Date:** 2026-10-19

**Related PRD:** [`specs/prd/2026-10-19-1802-report-quote-prd.md`](../prd/2026-10-19-1802-report-quote-prd.md)

**Related Journeys:** [`specs/user-journeys/2026-10-19-1802-report-quote-journeys.md`](../user-journeys/2026-10-19-1802-report-quote-journeys.md)

---

## Overview

One epic and two stories, 8 points in total. Each story is a releasable increment that works end to end (API, web, data) and can be checked by hand (`curl` and the browser, ADR-001).

Story IDs come from `story-id-tracker` (`random` strategy, see `.specs-config.yaml`).

---

## Epic Breakdown

### Epic 1: Report a Quote

**Goal:** readers can send an approved quote back to moderation; moderators see why it came back and decide; repeated abuse is bounded.

**Journeys covered:** 1 (reader reports), 2 (moderator reviews), 3 (abuse attempt).

---

## Story Mapping Table

| Epic | User Story | Priority | Dependencies | Estimated Points |
|------|------------|----------|--------------|------------------|
| Report a Quote | US-zdeix: Report a quote back to moderation | High | None | 5 |
| Report a Quote | US-csxzd: A re-approved quote can't be reported again | High | US-zdeix | 3 |

### US-zdeix: Report a quote back to moderation (5 points)

- **Delivers:** a reader can report a quote on `/` with a reason; it leaves `/` and shows up on `/moderate` marked as reported, with the reason.
- **Includes:**
  - `POST /api/quotes/:id/report` with `reason` in the closed list; 400, 404 and 409 errors through `problem()`, with the new kinds `invalid-report` and `quote-not-reportable`;
  - conditional update `approved` to `pending` with `report: { reason, reportedAt }`;
  - `GET /api/quotes/pending` returns `report` when present; `GET /api/quotes` shape unchanged;
  - Report button, reason picker, confirmation and errors on `DisplayPage`, and the reported quote dropped from the rotation;
  - **Reported** badge and reason on `ModeratePage`;
  - Approve on a reported quote removes `report`;
  - AGENTS.md: document the new optional field.
- **Releasable:** yes. The full report loop works, and the existing moderation flow handles the outcome.
- **Refinement notes:** raise an ADR for the data model change and the residual abuse risk (anonymous reports, no rate limiting). Rules to check: `DEV-CODE-BP06-R06` (error shape), `DEV-CODE-BP01-R03` (ADR security section).

### US-csxzd: A re-approved quote can't be reported again (3 points)

- **Delivers:** once a moderator re-approves a reported quote, it stays on `/`. Further reports get 409 and the UI says why.
- **Includes:**
  - Approve on a reported quote sets `reportClearedAt`;
  - the report endpoint refuses quotes with `reportClearedAt`, returning 409 `quote-not-reportable` with its own `detail`;
  - display page: the public API doesn't say which quotes are cleared (FR-5), so the button stays visible and a 409 shows its `detail` message. A `localStorage` "already reported by me" flag (best effort) hides the button on quotes this browser has already reported;
  - AGENTS.md: document `reportClearedAt`.
- **Releasable:** yes. It hardens US-zdeix against mass reporting.

---

## Dependency Visualization

```
US-zdeix (report loop, end to end)
    │
    ▼
US-csxzd (re-approval immunity + client-side "already reported" flag)
```

---

## Implementation Phases

### Phase 1: Report loop — 5 points
- US-zdeix
- **Success criteria:** report from `/`, gone on reload, visible with its reason on `/moderate`; approve or reject works; `GET /api/quotes` shape is identical before and after.

### Phase 2: Abuse guard — 3 points
- US-csxzd
- **Success criteria:** report, re-approve, report again gives 409 `quote-not-reportable`; the quote stays on `/`.

---

## Total Timeline Estimate

8 points, about 2 to 3 days for one developer, including manual verification and the ADR.

---

## Risk Factors

| Risk | Story | Mitigation |
|---|---|---|
| Data model change (two optional fields) | US-zdeix, US-csxzd | ADR at refinement; AGENTS.md updated in the same story |
| Anonymous mass reporting | US-csxzd | One-shot hide per quote; residual risk recorded in an ADR |
| Change to the shared `moderate()` helper breaks normal approvals | US-zdeix | Manual regression check: approve or reject a plain pending quote |

---

## Handoff to Refinement Skill

Run `/spec-driven:refine specs/story-maps/2026-10-19-1802-report-quote-story-map.md` once this brainstorming is validated and merged. Suggested filenames (`.specs-config.yaml` pattern `{STORY_ID}-[{kind}]-{short-name}.md`):

- `specs/product-backlog/backlog/US-zdeix-[feat]-report-quote.md`
- `specs/product-backlog/backlog/US-csxzd-[feat]-report-immunity.md`
