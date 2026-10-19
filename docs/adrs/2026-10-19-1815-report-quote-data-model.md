# ADR-003: Store quote reports on the quote document and bound anonymous abuse with one-shot immunity

<!-- Title format: "# ADR-NNN:" is what check_adr.sh in aisdlc-core/v0.1.0-rc.1 requires
     (kering-technologies/dso-shared-ressources PR #91). The file name keeps its timestamp. -->

## Status

Proposed

## Date

2026-10-19

## Context

The "Report a quote" feature (PRD `specs/prd/2026-10-19-1802-report-quote-prd.md`, stories `US-zdeix` and `US-csxzd`) lets any reader send an approved quote back to moderation. Two decisions follow from it.

1. **Data model.** The `quotes` collection holds `text`, `author`, `context`, `status`, `createdAt` (AGENTS.md). A reported quote has to be told apart from a fresh submission on `/moderate`, and the moderator has to see why it came back. A moderator's re-approval also has to be remembered, so the quote can't be hidden again.
2. **Abuse.** The app has no authentication (ADR-002, `docs/adrs/2026-10-19-1553-no-authentication.md`). Anyone who can reach the API can call the report route, as often as they like, on any quote. A report hides the quote immediately, so the report route is a "hide" button open to everyone.

Rate limiting, captcha and identity are out of scope (PRD section 7). The PM made the guard a release condition: both stories ship together (PRD v1.1).

Rules touched:

- `DEV-CODE-BP01-R01` (MUST): significant decisions, here a schema change and a security-posture choice, are documented in an ADR.
- `DEV-CODE-BP01-R03` (SHOULD): security implications are documented.
- `DEV-CODE-BP06-R06` (MUST): the new errors are Problem Details (`code/error-shape`).
- `DEV-SEC-BP01-R02` (manifest numbering; `R01` in the security baseline): identity on write routes. Still derogated by ADR-002.

## Decision

**Report state lives on the quote document, as two optional fields. `status` keeps its three values.**

| Field | Shape | Set when | Cleared when |
|---|---|---|---|
| `report` | sub-document: `reason` (one of `offensive`, `inaccurate`, `private-info`, `other`) and `reportedAt` (date) | A report succeeds (`approved` becomes `pending`) | A moderator approves the quote |
| `reportClearedAt` | date | A moderator approves a quote that had a `report` | Never (see Consequences) |

- "Reported" is a property of a `pending` quote, not a fourth status. Every existing filter on `status` (`GET /api/quotes` on `approved`, `GET /api/quotes/pending` on `pending`) keeps working unchanged.
- No migration is needed. A document without these fields means "never reported".
- The reason is a **closed enumeration**. No free text is stored.

**Abuse is bounded by product rules, not prevented.**

- A report is accepted only on a quote that is `approved` **and** has no `reportClearedAt`. Anything else gets 409 `quote-not-reportable`. This check and the status change are one conditional update, so concurrent calls can't both win.
- A quote can therefore be hidden by a report **at most once** in its life. After a moderator re-approves it, it is immune.
- Undoing a malicious report takes one moderator click (Approve).
- `GET /api/quotes` keeps its projection (`id`, `text`, `author`, `context`). Report data appears only on `GET /api/quotes/pending`.

## Alternatives Considered

### Alternative 1: A separate `reports` collection

- **Evaluation**: Allows a report history and report counts per quote.
- **Rejection rationale**: History and counts are out of scope (PRD section 7). A second collection would need a join on `/moderate` and a consistency rule between the two writes, for no user-visible gain.

### Alternative 2: A fourth status value `reported`

- **Evaluation**: Makes "reported" explicit in `status`.
- **Rejection rationale**: AGENTS.md fixes `status` to three values, and every filter, the moderation helper and the frontend types would need to change. A reported quote is, functionally, pending review.

### Alternative 3: Hide only after N reports

- **Evaluation**: Makes a single malicious report harmless.
- **Rejection rationale**: Without identity, one person reaches N alone. It also needs counts, which are out of scope. The PM chose immediate hiding.

### Alternative 4: Rate limiting by IP

- **Evaluation**: Slows down a loop.
- **Rejection rationale**: Out of scope (PRD section 7), would add middleware or a dependency, and is weak behind a shared office NAT.

## Consequences

### Positive

- No new collection, no migration, no new status. The change is additive.
- Each quote costs an attacker at most one hide, and costs a moderator at most one click.
- The public API shape is unchanged, so nothing leaks about reports.

### Negative

- **The first wave can't be prevented.** One loop can hide every approved quote that hasn't been cleared yet. `/` may show "No quotes yet" until a moderator acts.
- **Immunity is permanent.** A quote re-approved after a report can never be reported again, even for a new and legitimate reason. The way out is a manual database edit.
- **Only the latest report is kept**, and it is removed on re-approval. There is no trail of who or what triggered a hide (see ADR-004 for the logging side).

### Trade-offs

- Simplicity and no new dependency, over stronger abuse controls.
- A moderator's judgment is final, over letting readers re-open a decision.

## Security Implications

Required per `DEV-CODE-BP01-R03`.

- **New attack surface:** `POST /api/quotes/:id/report`, an unauthenticated write route (ADR-002 already covers "any other future write action"). Its body accepts one field from a closed set. The id is checked as 24-hex before reaching MongoDB, as in the existing moderation route.
- **Injection / stored XSS:** none possible through the report. No free text is stored, and the reason label shown on `/moderate` comes from a fixed client-side map.
- **Data exposure:** report data is never returned by `GET /api/quotes`. It is returned by `GET /api/quotes/pending`, which is as open as `/moderate` (ADR-002).
- **Denial of content (integrity/availability):** the main threat. Mitigated, not removed, by one-shot immunity and one-click restore. Accepted for the training context.
- **Race conditions:** the conditional update makes report against report, and report against moderate, safe. The loser gets 409.
- **Threat model, top risk:** a mass-report loop empties `/`. Likelihood medium (open API), impact medium (content temporarily hidden, no data lost). Accepted.
- **Revisit** together with ADR-002: if the app gets identities, replace immunity by per-user limits.

## Related

- PRD: `specs/prd/2026-10-19-1802-report-quote-prd.md`
- Stories: `specs/product-backlog/backlog/US-zdeix-[feat]-report-quote.md`, `specs/product-backlog/backlog/US-csxzd-[feat]-report-immunity.md`
- ADR-002 (no authentication), ADR-004 (no structured logging)
- DSO rules: `DEV-CODE-BP01-R01/R03`, `DEV-CODE-BP06-R06`, `DEV-SEC-BP01-R02`
- Standard: `standards/code/error-shape.md`
