# How to Follow Standards (meta-standard)

> The standard for writing standards. Authors must follow this when adding a new standard under `standards/`. Consumers (developers, agents, CI) follow this when interpreting a standard's directives.

## Standard structure

Every standard is a single `.md` file under `standards/{theme}/{name}.md`. The file MUST have:

1. **Frontmatter** with at minimum `id`, `severity`, and `applies_to`:

   ```yaml
   ---
   id: "api/service-pattern"
   severity: "must"     # must | should | may (RFC 2119)
   applies_to:
     contexts: [backend]
     languages: [typescript]
   related_dso_rules:
     - "DEV-CODE-BP01-R02"   # SOLID — SRP & DI
     - "DEV-CODE-BP06-R07"   # Error boundaries per layer
   ---
   ```

2. **Statement of intent** — one paragraph explaining *why* this standard exists. If a reader can't articulate the problem the standard solves, the standard is too abstract; rewrite it.

3. **Rules** — bulleted, each rule self-contained. Use RFC 2119 keywords (`MUST` / `SHOULD` / `MAY`) for each rule, even if the standard's overall severity is set in frontmatter.

4. **Examples** — one good example, one bad example, both labelled. The validation sub-agent uses these to calibrate its judgement on borderline cases.

5. **Cross-references** — link related standards using their full ID (`code/error-shape`). Broken cross-references are flagged by the [`standards-coherence`](../../skills/standards-coherence/) check.

## Severity hierarchy

Per RFC 2119:

- **MUST** — a violation blocks the PR. The validation sub-agent emits a `violation`.
- **SHOULD** — the validation sub-agent emits a `warning` by default; a project-level configuration may promote `should` to `must` for stricter projects.
- **MAY** — informational. The validation sub-agent emits no finding by default.

Standards inherit their default severity from frontmatter `severity:`. Individual rules within a standard MAY use a different severity, in which case the per-rule label wins.

## Glob matcher guidelines

Matchers live in `index.yml` (the registry), not in the standard's `.md` file. Why: matchers change as the codebase reorganises; rule text changes much less often. Keep them separate so an author can add a rule without re-touching all the matchers, and a maintainer can re-glob without diffing rule text.

Matcher rules:

- **Be specific.** `**/*.ts` is a code smell — most standards apply to one subtree, not the whole codebase. If a standard genuinely applies everywhere, that's fine, but call it out.
- **Avoid overlapping matchers across contradictory standards.** When two standards prescribe incompatible patterns for the same files, [`standards-coherence`](../../skills/standards-coherence/) will flag the contradiction. Resolve by tightening matchers or adding an explicit precedence in the standards' bodies.
- **Test your matchers.** Run [`standards-check`](../../skills/standards-check/) locally before merging a new standard — if it returns `matcher_gaps`, your matcher selects no files; if `uncovered_files`, the matcher is broader than the rules cover.

## Cross-references and dependencies

A standard MAY reference:

- Other standards by full ID (`see also: code/error-shape`).
- DSO governance rules by ID in frontmatter `related_dso_rules:`. The [`spec-dso-rules`](../../skills/spec-dso-rules/) skill resolves these to full text on demand.
- ADRs by relative path (`see ADR-007 — error-shape decision`).

A standard MUST NOT:

- Reference a specific PR number, ticket key, or commit SHA — those are mutable; standards are durable.
- Reference an external URL without also vendoring or linking to a stable mirror — third-party docs disappear.

## Authoring workflow

1. **Open an ADR** if the standard codifies a non-trivial decision (most foundational standards do — they ARE architectural decisions).
2. **Draft the standard** under `standards/{theme}/{name}.md` per the structure above.
3. **Register** in `index.yml` with matchers, severity, description.
4. **Test locally**: run [`standards-check`](../../skills/standards-check/) against the codebase. Fix violations OR document the migration plan via `scope.yml` (start narrow, expand later).
5. **Run [`standards-coherence`](../../skills/standards-coherence/)** — verify the new standard doesn't contradict existing ones.
6. **Commit + PR** with the standards-related conventional commit scope your project uses (typically a project-defined scope under your standards-as-code workflow).

## Versioning

Standards are versioned together with the codebase — there's no per-standard version field. The git history of `standards/{theme}/{name}.md` is the change log; the parent commit is the canonical version.

When a standard is materially changed (rule tightened, scope widened), the change is itself an ADR-worthy decision — write the ADR, then update the standard, then re-run [`standards-impact`](../../skills/standards-impact/) to re-validate every file the standard now affects.
