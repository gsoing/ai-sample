# ADR-004: No structured logging, trace propagation or log-level configuration in this training project

<!-- Title format: "# ADR-NNN:" is what check_adr.sh in aisdlc-core/v0.1.0-rc.1 requires
     (kering-technologies/dso-shared-ressources PR #91). The file name keeps its timestamp. -->

## Status

Accepted

## Date

2026-10-19

## Context

`DEV-CODE-BP06` (Error Handling & Logging) is a Foundation guideline, and `aidlc-docs/aidlc-state.md` opts into `dso-foundation`. Three of its MUST rules are not met by the API today:

- `DEV-CODE-BP06-R02` (MUST, "All backend services"): structured log format with correlation IDs.
- `DEV-CODE-BP06-R04` (MUST, "All backend services"): W3C Trace Context (`traceparent`) propagated in logs.
- `DEV-CODE-BP06-R05` (MUST, "All projects"): log-level configuration with documented criteria.

The API logs with `console.log` at startup and `console.error` in the global error handler (`apps/api/src/index.ts`). There is no logger, no correlation id, no trace context and no level configuration.

The gap was surfaced while refining `US-zdeix` (report a quote), but it is project-wide and predates that story. Without an ADR, every backend story would either fake these three MUSTs or leave them silently unmet, and the `dso-foundation` honesty rule forbids both.

The other `DEV-CODE-BP06` rules are met: `R01`, `R06` and `R07` through `problem()` (`apps/api/src/problem.ts`) and the global error handler, and `R03` because no sensitive data is logged.

## Decision

**The API keeps plain console logging. The three rules above are downgraded from `[MUST]` to `[SHOULD]` once, here, for the whole backlog.**

| Rule | Status here | AC severity in stories |
|---|---|---|
| `DEV-CODE-BP06-R02`: structured logs, correlation IDs | Not satisfied | `[SHOULD]` |
| `DEV-CODE-BP06-R04`: W3C `traceparent` | Not satisfied. Single service, no outbound calls | `[SHOULD]` |
| `DEV-CODE-BP06-R05`: log-level configuration | Not satisfied | `[SHOULD]` |

What stays mandatory in every backend story:

- Unexpected errors reach the global error handler, which logs method, URL and the error, and returns a Problem Details `internal` response. The stack trace is logged, never returned.
- No sensitive data in logs (`DEV-CODE-BP06-R03`, MUST, unchanged).

Stories link this ADR in `related_adrs` and don't restate the downgrade.

Unlike ADR-001, this is a **"not yet"**: a story adding a small structured logger (built-in or one dependency) can supersede this ADR at any time, if the Product Manager prioritises it.

## Alternatives Considered

### Alternative 1: Add a structured logger now (for example pino) with a request-id middleware

- **Evaluation**: Satisfies `R02` and `R05`, and most of `R04`.
- **Rejection rationale**: Adds a dependency and a cross-cutting change to every route. Out of scope for the report-quote feature, and not requested by the PM. It can be its own story.

### Alternative 2: Mark the rules "not satisfied, out of scope" in each story without an ADR

- **Evaluation**: No extra document.
- **Rejection rationale**: A MUST left unmet without an ADR is a silent deviation, which the honesty rule forbids.

### Alternative 3: Claim compliance

- **Rejection rationale**: False, and visible to any reader of `index.ts`.

## Consequences

### Positive

- The compliance claim of every backend story stays true, with one link.
- No new dependency, no change to existing routes.

### Negative

- **No audit trail.** A burst of anonymous report calls (ADR-003) can't be traced afterwards: no request id, no timestamped structured record.
- Logs can't be queried or correlated if the project ever ships to a shared environment.

### Trade-offs

- A short training scope over observability that nobody consumes locally.

## Security Implications

Required per `DEV-CODE-BP01-R03`.

- **Weakened control:** detection. Abuse of open write routes (ADR-002), such as mass reporting (ADR-003), leaves no structured evidence.
- **New attack surface:** none. Nothing is added.
- **Sensitive data:** unchanged. `R03` stays MUST. No route logs request bodies.
- **Top risk:** an incident can't be investigated. Accepted for a local training project with fictional data.
- **Supersede this ADR** before any deployment outside a developer machine (same trigger as ADR-002).

## Related

- DSO rules: `DEV-CODE-BP06-R02/R03/R04/R05`, `DEV-CODE-BP01-R01/R03`
- Code: `apps/api/src/index.ts` (error handler), `apps/api/src/problem.ts`
- ADR-002 (no authentication), ADR-003 (report data model)
- Applies to every backend story in `specs/product-backlog/`
