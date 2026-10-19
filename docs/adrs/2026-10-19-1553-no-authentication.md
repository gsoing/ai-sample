# No authentication: bounded derogation for the training context

## Status

Proposed

## Date

2026-10-19

## Context

Office Quotes has no authentication, by design. `AGENTS.md` says so ("There is no authentication, by design"). `/moderate` is not linked in the navigation, but anyone who knows the URL can approve or reject quotes, and every API route is open.

The Kering security baseline is **always on and cannot be switched off** (`aidlc-composition/.../extensions/security/security-baseline.md`). It cites `DEV-SEC-BP01-R01` as the identity and access rule (every authenticated request carries a verified identity, via the centrally approved auth provider). In the DSO `rules-manifest` v1.13.0 the numbering differs: `DEV-SEC-BP01-R01` is secrets management and the SSO/OIDC rule is `DEV-SEC-BP01-R02` (MUST, scope "All internal applications"). This ADR derogates from **the identity rule under both numberings**, and the numbering gap should be raised with the DSO maintainers.

Because the baseline cannot be opted out of, this ADR is not an opt-out. It is an explicit, **bounded derogation**, valid only while the three facts below hold.

Three facts justify it:

1. **It is a training project.** Its purpose is to learn to work with an AI agent, not to run a service.
2. **The data is fictional.** The seed quotes are invented, and nobody is identified by them.
3. **It runs locally.** There is no deployment, no shared environment and no production data.

Other rules touched by this decision:

- `DEV-SEC-BP01-R03` (MUST, "All network configurations"): least privilege on network controls
- `DEV-CODE-BP01-R01` (MUST): significant decisions are documented in an ADR
- `DEV-CODE-BP01-R03` (SHOULD): security implications are documented

## Decision

**The application has no authentication and no authorization. This is a derogation from the identity rule of the security baseline (`DEV-SEC-BP01-R01` in the baseline extension, `DEV-SEC-BP01-R02` in the manifest), bounded to the training context.**

The derogation holds only while all three facts above are true. If any of them stops being true, this ADR no longer applies and must be superseded **before** the change ships:

| What changes | What it requires |
|---|---|
| The app is deployed anywhere other than a developer machine | Authenticate through the approved provider (SSO/OIDC) and protect `/moderate` and every write route |
| Real people or real quotes about identifiable people enter the data | Authentication, authorization (a moderator role) and a privacy review |
| The repository is reused as the base of a real project | Remove this derogation first, as the first story |

Stories must not restate the derogation. They link this ADR in `related_adrs`.

## Alternatives Considered

### Alternative 1: Add authentication (SSO/OIDC) and a moderator role

- **Evaluation**: Satisfies the baseline for real.
- **Rejection rationale**: Disproportionate for a training project. It needs an identity provider, secrets management and a user model, which would crowd out what the training teaches.

### Alternative 2: Claim compliance without implementing it

- **Evaluation**: Zero effort.
- **Rejection rationale**: Dishonest, and an auditor comparing the claim with the code finds no identity check.

### Alternative 3: Opt out of the security baseline

- **Evaluation**: Would remove the rule from the project.
- **Rejection rationale**: Not possible. The baseline is always on. A bounded derogation is the only honest form of exception.

## Consequences

### Positive

- The gap is explicit, bounded and reviewable instead of being silent.
- A reader of the repository, or of a spec, finds the reason in one link.
- The conditions that end the derogation are written down.

### Negative

- **Every route is open.** Any caller can create, approve or reject a quote, and any other future write action is open too.
- **`/moderate` is hidden, not protected.** Not linking it is not an access control.
- **"Runs locally" is weaker than it sounds.** `app.listen(port)` binds all network interfaces, and MongoDB publishes port 27017 with the default credentials of `.env.example`. On a shared network, another machine can reach both.
- The project cannot be shown to real users as is.

### Trade-offs

- A short, focused training over a realistic security setup.
- An explicit and expiring exception over a silent one.

## Security Implications

Required per `DEV-CODE-BP01-R03`.

- **Weakened control:** identity and access. No request is attributed to a person and no action is restricted to a role. Accepted only under the three facts of the Context.
- **New attack surface:** none added by this decision, since it records the existing state. The surface is the open API and the open `/moderate` page.
- **Network exposure:** the API and MongoDB listen on all interfaces. Mitigation for training sessions: work on a trusted network and run `pnpm db:down` when finished. Binding to `127.0.0.1` would be a code and `compose.yaml` change outside this ADR.
- **Secrets handling:** the only credentials are the MongoDB root defaults in `.env.example`, meant for a local container only. `.env` is gitignored.
- **Data classification:** fictional training data, no personal data.
- **Top risk:** the repository leaves the training context with the derogation still in place. Mitigated by the "What changes" table above.

## Related

- DSO rules: `DEV-SEC-BP01-R01` and `DEV-SEC-BP01-R02` (see Context for the numbering), `DEV-SEC-BP01-R03`, `DEV-CODE-BP01-R01/R03`
- Security baseline: `aidlc-composition/aidlc-core/v0.1/extensions/security/security-baseline.md`
- `AGENTS.md`, section "Office Quotes"
- Applies to every story in `specs/product-backlog/`
- **Supersede this ADR** before any change listed in "What changes"
