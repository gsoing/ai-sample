@AGENTS.md

# CLAUDE.md

This project (`dso-ai-sample-project`, Office Quotes) consumes the Kering AI-SDLC framework. The composition pin and the DSO governance opt-ins live in `aidlc-docs/aidlc-state.md`.

## Session opening behaviour: anchor every session in the framework

Every change goes through the spec-driven workflow operationalised by the `/spec-driven:*` slash commands (`brainstorm`, `refine`, `adr`, `implement`). **Do not bypass it on autopilot.** Before answering my first request in any new session, follow this protocol.

### Step 1: Orient (always, before doing anything)

Briefly check the framework state and report it back in 3 to 5 lines:

- **Composition pin**: read `aidlc-docs/aidlc-state.md` (the `composition:` and `governance:` keys).
- **Stories in flight**: list the files in `specs/product-backlog/sprint/`. If empty, say so.
- **Stories ready to start**: count the files in `specs/product-backlog/backlog/`.
- **Recent ADRs**: the newest 1 to 3 in `docs/adrs/` (filename and `## Status` line).
- **Latest commit**: `git log --oneline -1`.

Then say what the framework would suggest as a next step, given what I asked for.

### Step 2: Route the request to the framework

| If I'm asking for... | Default response |
|---|---|
| **A new feature or non-trivial product change** | Don't dive into code. Suggest `/spec-driven:brainstorm <topic>` and explain the gate (PM validation, merge, then refine). If I push back, ask why we're skipping the framework. |
| **To refine a story map row into a ready story** | Suggest `/spec-driven:refine <topic-or-story-map-path>`. |
| **An architectural decision is being made** | Suggest `/spec-driven:adr <topic>`. ADRs need a Security Implications section (`DEV-CODE-BP01-R03`) and live in `docs/adrs/`. |
| **To implement a story from the backlog** | Suggest `/spec-driven:implement <STORY_ID>`. Verify the story file exists in `specs/product-backlog/backlog/` (or `sprint/` if already in flight). |
| **A bug fix** | Ask whether it is trivial or deserves a spec round-trip. Default to the spec route for non-trivial fixes. |
| **A trivial change** (typo, comment, formatting) | Proceed without forcing the framework. Mention the conventional commit type (`chore`, `docs`, `fix`). |
| **A question about the framework itself** | Read `.claude/aisdlc-framework/` and `.claude/dso/docs/` first. |
| **A status, review or exploration request** | Answer directly. Don't force the framework. |

### Step 3: Honour the gates

- **3-role rule**: Product Manager, Agentic Code, Dev Reviewer. No role merges its own work. If I ask you to merge something I authored, refuse and explain why.
- **Never push without being asked**: do not run `git push`, create a pull request, or publish a branch to a remote unless I ask for it in this conversation. This overrides the push steps written in the `/spec-driven:*` skills and commands (for example the `git push origin -u` of the brainstorming skill). Commit locally and tell me what is ready to push.
- **No code without a story**: for non-trivial changes, the request must trace back to a `specs/product-backlog/{sprint,backlog}/<STORY_ID>-*.md` file. If it doesn't, suggest `/spec-driven:refine` first.
- **DoD is not optional**: walk the Definition of Done before declaring a story complete.
- **Honesty rule**: if a `[MUST]` criterion cannot be honestly satisfied, downgrade it to `[SHOULD]` and link a justifying ADR. Don't fake compliance. This repo is in that situation for tests and authentication: see `docs/adrs/`.

## ADR titles (temporary workaround)

The validator `check_adr.sh` shipped in `aisdlc-core/v0.1.0-rc.1` rejects ADR titles without a number, which is what the default `timestamp` id strategy produces (kering-technologies/dso-shared-ressources PR #91).

Until that fix is released and the `.claude/aisdlc-framework` submodule is bumped:

- Keep the timestamped file name, for example `docs/adrs/2026-10-19-1717-error-response-shape.md`.
- Write the level-1 title as `# ADR-NNN: <title>`, taking the next number after the highest one already used in the titles of `docs/adrs/` (list them with `grep -h '^# ADR-' docs/adrs/*.md`).
- Check it with `bash .claude/aisdlc-framework/plugins/spec-driven/skills/spec-validation/checks/check_adr.sh <file>`.

After the fix, the `ADR-NNN: ` prefix can be dropped and this section removed.

## Standards

`standards/` holds the project's standards-as-code (`standards/index.yml` is the registry). Before changing code under `apps/api/src/`, read the standards whose matchers cover the file.

## Commands added by the framework

| Command | Purpose |
|---|---|
| `pnpm setup:aisdlc` | Install the runtime dependencies of the three `standards-*` skills. Run once after cloning. |
| `pnpm standards:prepare` | Build the standards working set for the current diff. Honours `DIFF_BASE` (default `HEAD~1`). |
| `pnpm standards:impact` | Which existing code a standard change affects. |
| `pnpm standards:coherence` | Registry consistency (orphans, duplicate matchers). |
| `pnpm spec:validate` | Run the `spec-validation` harness. Some checks fail by design (dead paths in the framework bundle). |
