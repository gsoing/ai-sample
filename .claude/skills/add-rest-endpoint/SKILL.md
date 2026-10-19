---
name: add-rest-endpoint
description: Add a REST endpoint to the Office Quotes API following the repo conventions (route file, .js imports, Problem Details error format, validation, status codes). Use whenever the user asks for a new API route or HTTP endpoint.
---

# Add a REST endpoint

Follow these steps every time an endpoint is added to `apps/api`.

## 1. Place the code

- One route file per resource in `apps/api/src/routes/<resource>.ts`, exporting an Express `Router`.
- A new resource router is mounted in `apps/api/src/index.ts` under `/api/<resource>`.
- Relative imports need an explicit `.js` extension (NodeNext), for example `import { getDb } from '../db.js'`.
- Use the existing `getDb()` from `src/db.ts`. No ORM, no validation library.

## 2. Validate the input

- Hand-written validation in a small function (see `src/validation.ts`). Return `{ ok: true, value }` or `{ ok: false, error }`. The `error` string becomes the `detail` of the Problem Details response.
- Trim strings. Reject missing or non-string values.
- Never trust a client-supplied `status`.
- Route parameters that are Mongo ids must match `/^[0-9a-f]{24}$/i` before `new ObjectId(id)`.

## 3. Answer with the right status code

| Case | Status | Body |
|---|---|---|
| Read succeeded | 200 | JSON data |
| Resource created | 201 | `{ "id": string }` |
| Invalid input or malformed id | 400 | Problem Details |
| Unknown id | 404 | Problem Details |
| State transition not allowed (for example approving a quote that is not `pending`) | 409 | Problem Details |

Every error is an RFC 9457 Problem Details object (`type`, `title`, `status`, `detail`) served as `application/problem+json`. Build it with `problem(res, kind, detail)` from `src/problem.ts`. If no existing `kind` fits, add one to the table in that file. Never return HTML, a bare string or `{ "error": ... }`.

## 4. Respect the quote rules

- Quote `status` is `pending`, `approved` or `rejected`.
- The only valid transitions are `pending -> approved` and `pending -> rejected`.
- Public read endpoints return only `approved` quotes, and never expose `status` or `_id` (return `id` as a string).

## 5. Verify

Run from the repo root: `pnpm lint && pnpm typecheck && pnpm build`. Then call the endpoint with `curl` against `pnpm dev:api` and check the success case plus at least one 400, one 404 and one 409 when they apply.
