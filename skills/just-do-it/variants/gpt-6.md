---
name: just-do-it
description: 'Finish a proposed change and deliver a reviewed PR ready for Jesse.'
---

# Just Do It

When explicitly invoked, finish the change and deliver one PR ready for Jesse.

Check code, PR and review/test evidence. Start at the first unfinished or invalidated step; reuse still-applicable results.

For useful independent work, use `spawn_agent` with `agent_type`: "investigator" for questions and "implementer" for bounded changes and focused tests. Supply objective, worktree and revision or source, scope, constraints, acceptance criteria and evidence. Keep sequencing, integration, shared verification and delivery here; route independent review through `code-review`. Do not launch a fixed tree. If roles are unavailable, continue suitable local work and report the limit without rebuilding prompts or changing configuration.

1. Before publication, inspect CI triggers for draft, synchronize and readiness events. Identify local checks and provider-only evidence. If publication starts paid jobs, finish local work and prepare the diff and proof, then explain the conflict and safe path. Do not silently spend or suppress checks.
2. Finish implementation and confirmed repairs, commit locally and resolve the PR base. Use `code-review` on the current head and full PR diff, including all branch commits, not the latest commit's parent. The coordinator may assess review reuse and run needed review. Complete local validation, reusing valid results. Use `frontend-ui-validation` for web/native UI and keep its proof.
3. Prepare `pr-proof-pack` for the final diff. If publication allows inspection before CI, push the reviewed branch, create or update Jesse's draft PR and publish the proof pack. For an approved dependent chain, discover `gh stack` commands and preserve each PR's gates.
4. Before CI, give Jesse the PR link and an inspection checkpoint: user-visible result, observed problem, key design decisions, local proof, platform gaps, review focus, planned final CI and spending constraints. Wait for his go-ahead for that run once; silence, a merge reaction or general delivery authority does not count. Resolve feedback and recheck affected evidence/review. Request revised go-ahead only if feedback materially changes the explained run.
5. After go-ahead, run the explained final CI and required checks without another routine spending question. If readiness triggers CI, mark ready only after local review, proof and conflict checks, include readiness in the explained run and report CI pending until verified. Diagnose failures and pass applicable local checks before justified reruns. Approval for one run is not unlimited paid retry authority; preserve provider-only limits and spending restrictions. If existing authority does not cover a paid retry, explain the diagnosis and request approval before spending. For PRs targeting `openclaw/*`, follow `code-review`'s explicit ClawSweeper workflow before final CI where possible; disclose ordering conflicts at inspection.
6. When checks pass and no conflicts remain, mark ready if draft and report the result to Jesse. Do not merge.

Continue authorized local work through administrative checkpoints and diagnostic warnings. Leave a blocked PR draft and explain the problem, consequence, remaining work and alternative—not just counts or hashes.

Explain decisions plainly without routine citations to internal instructions; preserve required safety/approval disclosures.

## Permissions

Before GitHub writes, verify account `jesse-merhi` and Jesse's authorship of an existing PR.

No force-push, merge/automerge, deployment, destructive actions, labels, or reactions. The only allowed public comment is exactly `/clawsweeper re-review`, when required by step 5; no prose additions. Ask before new dependencies, breaking changes, or unrelated scope.
