# `@agent-standard-disable` — Audit-Trailed Escape Hatch

> The escape-hatch convention for opting out of a specific standard on a specific file/block/line. Modeled on ESLint's `eslint-disable` but with a **mandatory reason** after `--`. Every disable shows up in the audit trail produced by [`standards-check`](../../skills/standards-check/) under `disabled_standards`.

## When to use

Use the escape hatch ONLY for genuine edge cases that the standard didn't anticipate:

- **Legacy code under planned migration** — the standard's pattern can't apply until a refactor lands; the refactor is on the roadmap with an ADR.
- **External constraint** — the file integrates with an SDK / framework that mandates a different shape.
- **Standard is genuinely wrong here** — the standard doesn't anticipate a sub-case; the right fix is to update the standard, but you need to ship today and have an ADR following up.

In all three cases the disable is a **temporary workaround**. The reason explains *why now* and ideally links to the follow-up (ADR, migration ticket, standards revision).

## Don't use the escape hatch for

- Skipping work because the violation is annoying. Adapt the code instead.
- Hiding a real violation from CI without team awareness — the disable is visible in PR comments and the audit trail.
- Bypassing a `MUST` standard without an accompanying ADR. The disable surfaces in the audit trail; an auditor will ask why.

## Syntax

### Inline (one line)

```typescript
const result = await db.collection('users').findOne({ email }); // @agent-standard-disable code/no-direct-orm-access -- legacy code path under planned migration in <JIRA-KEY>
```

The disable applies to the same line. The reason after `--` is required and must be at least one word.

### Block (multi-line)

```typescript
/* @agent-standard-disable code/no-direct-orm-access -- entire migration shim, will be deleted with <JIRA-KEY> */
const users = await db.collection('users').find({ active: true }).toArray();
const orgs = await db.collection('orgs').find({ id: { $in: users.map(u => u.orgId) } }).toArray();
/* @agent-standard-enable code/no-direct-orm-access */
```

The disable applies from the `disable` directive through the matching `enable` directive (or end of file if no `enable` is found). The reason after `--` is required.

### File scope

Place the directive at the top of the file (within the first 10 lines), before any code:

```typescript
// @agent-standard-disable api/service-pattern -- this file IS the legacy compatibility shim; pattern intentionally bypassed; see ADR-014
```

The disable applies to the entire file.

## Multiple standards on one line

Comma-separate standard IDs:

```typescript
// @agent-standard-disable api/service-pattern, code/error-shape -- legacy auth flow, migration planned Q2 (<JIRA-KEY>)
```

Both standards are disabled on the same line, sharing the reason.

## What the validators do

- The [`standards-check`](../../skills/standards-check/) sub-agent that processes this file:
  - Recognises the directive and skips the affected scope (line/block/file).
  - Records the disable in its per-file output's `disabled_standards` array, including: standard ID, reason, line, scope.
- The orchestrator aggregates all disables across all files into the final output's top-level `disabled_standards` array.
- CI surfaces the disabled list in the PR comment (via the [`upsert-comment`](../../ci-patterns/claude-code-action/) action).
- A reviewer (or auditor querying git history later) can see every escape-hatch use and its stated reason.

## Reason quality

Reasons must be specific enough for an auditor 6 months later to understand the context. Good and bad examples:

| ❌ Bad | ✅ Good |
|---|---|
| `-- temporary` | `-- depends on legacy auth, migration planned Q2 (<JIRA-KEY>)` |
| `-- TODO` | `-- SDK requires this shape; tracking upstream issue at vendor-org/their-repo#456` |
| `-- doesn't apply` | `-- this file IS the integration shim with the third-party SDK; standard intentionally bypassed; see ADR-014` |
| `-- skip` | `-- standard is wrong for this sub-case; updating the standard via <JIRA-KEY>, this is the bridge until merge` |

A reason that wouldn't survive a code review by a human reviewer fails the test. The validation sub-agent doesn't attempt deep judgement on reason quality — that's the human reviewer's call — but it does flag empty or `--`-only reasons as warnings.

## Lifecycle

Every disable should ideally be temporary:

1. **Add** the disable with a specific reason linking to follow-up work.
2. **Track** the follow-up (ticket, ADR, migration plan).
3. **Remove** the disable when the follow-up lands. Re-run [`standards-check`](../../skills/standards-check/); if it now passes, delete the disable line.

A disable that has lived in the codebase for over a quarter without follow-up motion is itself worth a periodic audit. Tools / dashboards reading the [`standards-check`](../../skills/standards-check/) output can surface "stale disables" (reason is older than N quarters, no related ADR `Accepted` in the same quarter).
