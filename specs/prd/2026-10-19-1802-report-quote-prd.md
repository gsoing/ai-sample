# PRD: Report a Quote

**Date:** 2026-10-19

**Author:** Office Quotes team (brainstorming session)

**Status:** In Review

**Version:** 1.0

---

## 1. Problem Statement

### What problem are we solving?

Once a moderator approves a quote, it stays on `/` forever. If a quote turns out to be inappropriate (offensive, inaccurate, exposing private information) or was approved by mistake, a reader has no way to say so, and no moderator will see it again. The only fix today is someone editing the database by hand.

### Who experiences this problem?

- **Primary:** readers of the display page (`/`), usually colleagues looking at the office screen or browsing quotes.
- **Secondary:** moderators on `/moderate`, who need a second look at quotes that have gone wrong.
- **Tertiary:** the people being quoted, who may not want a line repeated out of context.

### Why does this problem matter?

The app shows quotes about real colleagues. One bad quote left on screen damages trust in the whole app and can turn into an HR issue. A low-friction way to "pull the cord" keeps the display page safe without making moderation heavier.

---

## 2. Solution Overview

### High-Level Approach

Every quote on the display page gets a **Report** button. The reader picks one of four fixed reasons (offensive, inaccurate, private information, other) and confirms. The quote goes straight back to `pending`: it disappears from `/` at the next load and shows up again in the `/moderate` queue, with a visible **Reported** marker and the reason chosen.

The moderator then uses the existing flow. **Approve** puts the quote back on `/`. **Reject** removes it for good. No new moderator page and no new moderation action.

The app is anonymous by design (ADR-002, `docs/adrs/2026-10-19-1553-no-authentication.md`), so anyone can report any quote, and a report hides the quote immediately. To keep that from becoming a "hide everything" button, a quote a moderator **re-approves after a report** is marked as cleared and can't be reported again. Each quote can be hidden by a report at most once, and every hide costs one moderator click to undo.

### Key Value Propositions

- Readers can get an inappropriate quote off the screen in two clicks, with no account.
- Moderators get bad quotes back in their existing queue, with the reason, and no new workflow to learn.
- Bounded abuse: hiding by report is a one-time event per quote, and undoing it takes one click.

---

## 3. Success Metrics

### How do we measure success?

This is a training project with no analytics, so success is checked by hand.

| Metric | Target | How checked |
|---|---|---|
| Time from report to hidden on `/` | Next page load | Manual: report, reload `/` |
| Clicks for a reader to report | 2 (Report, then confirm a reason) | Manual walk-through |
| Moderator can tell a reported quote from a new submission | 100% of reported quotes show the marker and reason | Manual check on `/moderate` |
| A re-approved reported quote can't be hidden again | 409 on every further report | `curl` |
| No report data leaks on the public API | `GET /api/quotes` response shape unchanged | `curl` diff before and after |

---

## 4. User Personas

### Primary Persona: the Reader

- **Who:** a colleague glancing at `/` on the office screen or on their laptop.
- **Goal:** enjoy the quotes; if one is out of line, get rid of it quickly without a fuss.
- **Frustrations:** no way to act on a bad quote; doesn't want to log in or explain at length.
- **Tech level:** any.

### Secondary Persona: the Moderator

- **Who:** the person who knows the `/moderate` URL and reviews submissions.
- **Goal:** keep `/` clean with minimal effort; understand why a quote came back.
- **Frustrations:** can't tell a reported quote from a new one; worried about someone mass-reporting quotes.

---

## 5. Functional Requirements

### What must the product do?

**FR-1: Report endpoint**
- `POST /api/quotes/:id/report` with a JSON body `{ reason }`.
- `reason` is required and one of `offensive`, `inaccurate`, `private-info`, `other`. No free text.
- Only valid on a quote whose `status` is `approved` and that has not already been cleared after a report.
- On success: the quote's `status` becomes `pending`, a `report` record is stored on it (reason and timestamp), and the response is `200` with `{ id, status: "pending" }`.
- Errors, all RFC 9457 Problem Details through `problem()` (`DEV-CODE-BP06-R06`):

| Case | Status | Problem `type` |
|---|---|---|
| `:id` is not a 24-character hex string | 400 | `/errors/invalid-quote-id` (existing) |
| Missing or unknown `reason`, or body not an object | 400 | `/errors/invalid-report` (new) |
| No quote with this id | 404 | `/errors/quote-not-found` (existing) |
| Quote is not `approved` (`pending` or `rejected`) | 409 | `/errors/quote-not-reportable` (new) |
| Quote was already reported and re-approved by a moderator | 409 | `/errors/quote-not-reportable` (new, different `detail`) |

- The status change is a single conditional update (`status = approved` and not cleared), so two concurrent reports, or a report racing a moderator action, can't produce an inconsistent state: one wins, the other gets 409.

**FR-2: Report button on the display page**
- Each quote shown on `/` has a **Report** button.
- Clicking it shows the four reasons as a choice and a confirm and a cancel action. Nothing is sent until the reader confirms.
- After a successful report: the quote is removed from the local rotation, the page moves on to the next quote, and a confirmation message says the quote has been sent back to moderation.
- On error, the message shown comes from the Problem Details `detail` (AGENTS.md convention).

**FR-3: Reported marker on `/moderate`**
- `GET /api/quotes/pending` also returns, for a reported quote, `report: { reason, reportedAt }`. A plain new submission has no `report`.
- `/moderate` shows a visible **Reported** badge and the human-readable reason on those quotes.
- The queue order stays as it is (by `createdAt`, oldest first).

**FR-4: Moderator decision on a reported quote**
- **Approve** (existing `PATCH /api/quotes/:id/approve`): the quote becomes `approved`, the `report` record is removed and the quote is marked as cleared (`reportClearedAt`). From then on, FR-1 refuses any new report on it with 409.
- **Reject** (existing `PATCH /api/quotes/:id/reject`): the quote becomes `rejected`. The `report` record may stay, since nothing reads it.
- Approving or rejecting a quote with no report behaves exactly as today.

**FR-5: Public API stays private**
- `GET /api/quotes` keeps its exact current shape: `id`, `text`, `author`, `context`. It never exposes `status`, `_id`, `report` or `reportClearedAt`.
- A pending reported quote is never returned by `GET /api/quotes`, since that route already filters on `approved`.

### Data model (schema, not code)

Two optional fields are added to documents in the `quotes` collection:

| Field | Type | Present when | Meaning |
|---|---|---|---|
| `report` | object `{ reason, reportedAt }` | The quote was reported and is waiting for a moderator | `reason`: one of the four categories. `reportedAt`: date of the report. |
| `reportClearedAt` | date | A moderator approved the quote after a report | The quote has been reviewed after a report and can't be reported again. |

No migration is needed. Existing documents have neither field and behave as "never reported".

### Report flow (state diagram)

```
               POST /report (reason)
  approved ─────────────────────────────▶ pending + report
     ▲   (only if no reportClearedAt)           │
     │                                          │
     │   PATCH /approve                         │ PATCH /reject
     └──── (unset report, set reportClearedAt) ─┤
                                                ▼
                                            rejected

  approved + reportClearedAt ── POST /report ──▶ 409 quote-not-reportable
  pending / rejected         ── POST /report ──▶ 409 quote-not-reportable
```

---

## 6. Non-Functional Requirements

### Performance
- The report endpoint does one conditional update, plus one read only on failure to pick the right error (same pattern as the existing `moderate()` helper). No new index needed at this data volume.

### Security
- **Anonymous by design** (ADR-002). Abuse is limited by product rules, not by identity:
  - each quote can be hidden by a report **at most once** (`reportClearedAt` immunity);
  - a hidden quote can't be reported again, so repeated calls get 409;
  - every hide is undone in one moderator click;
  - the reason is a closed set, so no free text gets stored (no XSS, injection or PII risk from the report body).
- The browser remembers which quotes this reader has reported (`localStorage`, best effort) and hides the button on those. This is only a convenience, not a security control.
- Residual risk, accepted: someone can call the API in a loop and hide every not-yet-cleared approved quote once. Impact: `/` shows fewer quotes until a moderator re-approves them. Rate limiting is out of scope (see section 7); refinement should record this trade-off in an ADR.
- Error responses go through `problem()` only (`DEV-CODE-BP06-R06`).

### Scalability
- No change. One office, tens to hundreds of quotes.

### Usability
- The Report button is a plain `<button>`, reachable by keyboard and labelled so a screen reader can tell what it reports.
- The reason picker can be cancelled. Confirmation and errors are announced (`role="status"` or `role="alert"`).
- Human-readable reason labels: "Offensive", "Inaccurate", "Private information", "Other".

---

## 7. Out of Scope

### What are we NOT building?

- **Authentication**, for readers or moderators (ADR-002).
- **Rate limiting infrastructure** (middleware, IP throttling, captcha).
- **Moderator notifications** (email, chat, badges outside `/moderate`).
- **Report counts** or thresholds ("hide after N reports").
- **Report history**: only the current report is kept, and it is removed when the moderator re-approves.
- **Free-text reasons.**
- A way to "un-clear" a quote so it becomes reportable again.
- Reporting from anywhere other than `/` (for example from `/moderate` or `/submit`).

---

## 8. Assumptions & Constraints

### Assumptions
- Moderators check `/moderate` often enough that a hidden quote doesn't stay hidden for long.
- One review after a report is enough. If a moderator re-approves a quote, the team accepts that it stays up.
- Readers will pick a reason honestly enough for it to help triage. "Other" covers the rest.

### Constraints
- Fixed architecture: Express 5 + MongoDB driver, Vite + React. No new dependency is needed.
- `status` stays one of `pending`, `approved`, `rejected`. No new status value: "reported" is a property of a pending quote, not a fourth state.
- No test runner (ADR-001, `docs/adrs/2026-10-19-1552-no-test-runner.md`): verification is manual, with `curl` and the browser.
- Errors as RFC 9457 Problem Details through `apps/api/src/problem.ts`. The two new kinds (`invalid-report`, `quote-not-reportable`) are added there.
- The route lives in the existing `apps/api/src/routes/quotes.ts` (one route file per resource).

---

## 9. Dependencies

- Existing moderation endpoints and `moderate()` helper in `apps/api/src/routes/quotes.ts`, which change for FR-4.
- `problem()` registry in `apps/api/src/problem.ts`.
- `DisplayPage` and the `nextInCycle` rotation (`apps/web/src/lib/cycle.ts`), which need to drop a reported quote.
- `ModeratePage`, for the reported badge.
- AGENTS.md "Office Quotes" section, which documents the fields of the `quotes` collection and must be updated with `report` and `reportClearedAt`.

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Mass reporting empties `/` | Medium | Medium | One-time hide per quote; one-click restore; residual risk recorded in an ADR |
| A legitimate second report is refused after a re-approval | Low | Low | Accepted. The moderator already reviewed it. Edit the database by hand if needed |
| Moderators miss reported quotes in the queue | Low | Medium | Visible badge and reason; same queue as submissions |
| Data model change drifts from AGENTS.md | Medium | Low | Update AGENTS.md in the same story |
| Report racing a moderator action | Low | Low | Conditional update; the loser gets 409 |

---

## 11. Timeline & Milestones

| Milestone | Content | Estimate |
|---|---|---|
| M1 | A reader reports a quote end to end; moderator sees it marked (US-zdeix) | 5 points |
| M2 | Abuse guard: a re-approved quote can't be reported again (US-csxzd) | 3 points |

Total: 8 points, roughly 2 to 3 days of work for one developer.

---

## 12. Open Questions (with proposed answers)

| # | Question | Proposed answer |
|---|---|---|
| 1 | How is "reported" stored? | Optional `report: { reason, reportedAt }` sub-document on the quote, plus `reportClearedAt` after a re-approval. No new collection, no new status value. Document the change in AGENTS.md; refinement decides whether it needs an ADR (`/spec-driven:adr report-data-model`). |
| 2 | Is a reason requested, and how long? | Yes, required, from a closed list: `offensive`, `inaccurate`, `private-info`, `other`. No free text, so there's no length limit to define. |
| 3 | What stops one reader from reporting every quote in a loop? | No identity is available. Bound the damage instead: a hidden quote can't be re-reported (409), a re-approved quote is immune (409), and restoring takes one click. The client-side `localStorage` flag is a convenience only. Rate limiting stays out of scope; write an ADR on the residual risk. |
| 4 | Does `GET /api/quotes` expose anything about reports? | No. Its projection stays `id, text, author, context`. Report data is only returned by `GET /api/quotes/pending`, which is reached from the unlinked `/moderate` page. |

---

## 13. Approvals

| Role | Name | Status |
|---|---|---|
| Product Manager | _to be filled in_ | Pending |
| Dev Reviewer | _to be filled in_ | Pending |

---

## Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-10-19 | Brainstorming session | Initial draft |
