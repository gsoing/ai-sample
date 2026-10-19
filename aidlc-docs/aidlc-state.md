# AI-SDLC State — dso-ai-sample-project (Office Quotes)

> Adoption record of the Kering AI-SDLC framework for this project. Updated as a **deliberate act**, never auto-generated: the audit trail must capture every framework version change.
>
> **This file has two roles:**
> 1. Declare the framework version consumed and the DSO governance tiers opted into.
> 2. Act as the **project root sentinel**. Three framework scripts walk up the tree looking for a directory that holds both `aidlc-docs/` **and** `.specs-config.yaml`. Without both, `.specs-config.yaml` is silently ignored.

```yaml
# --- Composition pinning -------------------------------------------------
composition: "github.com/kering-technologies/dso-digital_factory-ai_sdlc@aisdlc-core/v0.1.0-rc.1"

# --- Governance opt-ins --------------------------------------------------
#   dso-foundation   Mandatory baseline, from day 1.
#   dso-growth       Additive. When Foundation has been green for a quarter.
#   dso-excellence   Additive. When Foundation and Growth have been green for a quarter.
#
# The security baseline is ALWAYS ON and is not declared here. It cannot be
# switched off; the only way to depart from it is a bounded derogation recorded
# in an ADR (see docs/adrs/*-no-authentication.md).
#
# The opt-in is a declaration of intent: no script enforces it. Honour it in review.
governance:
  - dso-foundation

# --- DSO manifest pin ----------------------------------------------------
# Tag checked out in the .claude/dso submodule (commit 17407a2).
# The manifest declares `version: 1.0.0` internally: that is the schema version,
# not the release tag.
dso_manifest_version: "v1.13.0"

# --- Stack context (selects which DSO rules apply) -----------------------
# Crossed with the `applies_to` block of every guideline in rules-manifest.yaml.
# With these values, 23 of the 24 guidelines of v1.13.0 apply.
stack:
  languages: [typescript]
  contexts: [backend, frontend]
  project_types: [monolith]

# --- Standards-as-code ---------------------------------------------------
standards_as_code:
  adopted: true
  scope_file: "standards/scope.yml"

# --- CI ------------------------------------------------------------------
ci:
  # No CI in this training project. The consequences on the test-related rules
  # are recorded in docs/adrs/*-no-test-runner.md.
  claude_code_action: false
```

## Fields

| Field | Role | When to update |
|---|---|---|
| `composition` | Framework version pinned by this project | On a deliberate bump to a new release |
| `governance` | DSO maturity tiers opted into | When the project moves to the next tier |
| `dso_manifest_version` | DSO rules release this project complies with | When the `.claude/dso` submodule is bumped |
| `stack` | Technical context used to filter the applicable rules | When the stack changes |
| `standards_as_code` | Whether `standards/` is in use and where its scope file lives | When adopting or dropping standards-as-code |
| `ci` | Whether a CI pipeline exists | When CI is added or removed |
