---
name: just-do-it
description: 'Finish a proposed change and deliver a reviewed PR ready for Jesse.'
---

# Just Do It

When explicitly invoked, finish the proposed change and deliver one PR ready for Jesse to inspect.

Check the code, PR, and current review/test evidence. Start at the first unfinished or invalidated step; keep completed work whose evidence still applies.

1. Inspect publication and CI triggers before pushing or opening a PR, including draft, synchronize and readiness events. Identify the local checks and any provider-only evidence. If publication itself starts paid jobs, finish the local work and prepare the concrete diff and proof before explaining the conflict and recommending a safe path; do not silently spend or suppress required checks.
2. Finish implementation and confirmed repairs, commit locally, and resolve the planned PR base. Complete `code-review` on the current head against that full planned PR comparison, including all branch commits; before PR creation, do not default to the latest commit’s parent. This invocation authorizes that review. Run applicable local validation; reuse evidence that still applies. For web or native UI, use `frontend-ui-validation` and retain its practical proof.
3. Prepare `pr-proof-pack` for the final diff. When publication can preserve inspection before CI, push the reviewed feature branch and create or update Jesse's draft PR, then complete proof-pack publication. For an approved dependent PR chain, discover the installed `gh stack` commands and preserve each PR's own gates.
4. Give Jesse the PR link and a self-contained inspection checkpoint before starting CI. Explain the user-visible result, observed problem, important design decisions, local proof, remaining platform gaps and what deserves his attention. Describe the final CI run and any real spending constraint so his go-ahead authorizes that explained run once. Allow him to inspect; silence, an earlier merge reaction or general delivery authority is not this go-ahead. Resolve feedback and recheck affected local evidence and review before CI; obtain a revised go-ahead if feedback materially changes the explained run. Preserve still-valid approval when it does not.
5. After his go-ahead, run the explained final CI and required repository checks without another routine spending question. If readiness is the CI trigger, mark ready at this point only after local review, proof and conflict checks pass; include that event in the explained run and report CI as pending until verified. CI is the final gate: diagnose a failure and pass applicable local checks before a justified rerun. Preserve provider-only evidence limits and actual external spending restrictions; approval for one run is not unlimited retry authority. Use a paid retry only when existing explicit authority covers it; otherwise explain the diagnosed failure and proposed retry before requesting that new spend. For PRs targeting `openclaw/*`, follow the explicit ClawSweeper workflow in `code-review` before final CI where the provider permits it; disclose any ordering conflict at the inspection checkpoint.
6. When all required steps pass and the PR has no conflicts, mark it ready if still draft and report the verified result to Jesse. Do not merge it.

Continue already-authorized local work through administrative checkpoints and diagnostic warnings. Reuse valid decisions, reviews and validation. Leave the PR draft when an actual blocker remains, explaining the observed problem, consequence, remaining work and recommended alternative. Scale the explanation to the decision; counts and hashes alone are not a useful handoff.

Explain practical decisions in your own words without routinely citing internal instructions. Preserve disclosures required by higher-priority approval or safety rules.

## Permissions

Before GitHub writes, verify account `jesse-merhi` and Jesse's authorship of an existing PR.

No force-push, merge/automerge, deployment, destructive actions, labels, or reactions. The only allowed public comment is exactly `/clawsweeper re-review`, when required by step 5; no prose additions. Ask before new dependencies, breaking changes, or unrelated scope.
