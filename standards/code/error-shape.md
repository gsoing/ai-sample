---
id: "code/error-shape"
severity: "must"     # must | should | may (RFC 2119)
applies_to:
  contexts: [backend]
  languages: [typescript]
related_dso_rules:
  - "DEV-CODE-BP06-R06"   # Error responses must follow a structured problem details format
  - "DEV-CODE-BP06-R01"   # Errors must be handled explicitly with meaningful context
  - "DEV-CODE-BP06-R07"   # Each application layer must implement error boundaries
---

# `code/error-shape` — Error responses follow RFC 9457 Problem Details

| | |
|---|---|
| **ID** | `code/error-shape` |
| **Severity** | `must` |
| **Derives from** | `DEV-CODE-BP06-R06` (MUST, scope "All backend APIs") |
| **DSO source** | `.claude/dso/export/code/error-handling-logging.md`, section *RFC 9457 Problem Details* |
| **Applies to** | `apps/api/src/**/*.ts` (the real glob lives in `standards/index.yml`) |

> `related_dso_rules:` is documentation only: no framework script parses the frontmatter of the files in `standards/`.

## Rule

Every error returned by an HTTP boundary **must** be a Problem Details object (RFC 9457) with the content type `application/problem+json`. The DSO rule cites RFC 9457, which obsoletes RFC 7807. The fields are the same.

| Field | Type | Required | Role |
|---|---|---|---|
| `type` | string (URI reference) | yes | Stable identifier of the error type, for example `/errors/quote-not-found` |
| `title` | string | yes | Short human summary, stable for a given `type` |
| `status` | number | yes | HTTP status code |
| `detail` | string | yes | Explanation specific to this occurrence |
| `instance` | string | no | URI of this occurrence |

## Why

Structured errors let clients handle failures without guessing the shape, and they improve the developer experience (the `rationale` of `DEV-CODE-BP06-R06`). An ad hoc `res.status(404).json({ error: '...' })` forces every consumer to know that one route's private convention.

## Compliant

```typescript
res
  .status(404)
  .type('application/problem+json')
  .json({
    type: '/errors/quote-not-found',
    title: 'Quote not found',
    status: 404,
    detail: `No quote with id ${id}`,
    instance: `/api/quotes/${id}`,
  })
```

## Non-compliant

```typescript
// Ad hoc object: no type, no status, not a standard shape
res.status(404).json({ error: 'Quote not found' })

// Raw string
res.status(500).send('something broke')
```

## Internal / external boundary

The stack trace is **logged**, never included in the response. No sensitive data in responses or logs (`DEV-CODE-BP06-R03`, part of the always-on security baseline).

## Review checkpoints

1. Does every error response crossing an HTTP boundary carry `type`, `title`, `status` and `detail`?
2. Is `type` a stable URI reference rather than a free message?
3. Does `status` match the HTTP semantics?
4. Is the content type `application/problem+json`?
5. Is the stack trace absent from the response?

## Escape hatch

When the rule cannot honestly apply:

```typescript
// @agent-standard-disable code/error-shape -- reason, see ADR-xxx
```

The reason after `--` is mandatory and appears in `disabled_standards` in the `standards-check` output. See `standards/agent-standard-disable.md`.
