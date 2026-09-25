---
name: just-do-it
description: 'Finish a proposed change and deliver a reviewed PR ready for Jesse.'
---

# Just Do It

When explicitly invoked, finish the change and deliver one PR ready for Jesse.

Check code, PR and review/test evidence. Start at the first unfinished or invalidated step; reuse still-applicable results.

For useful independent work, use `spawn_agent` with `agent_type`: "investigator" for questions and "implementer" for bounded changes and focused tests. Supply objective, worktree and revision or source, scope, constraints, acceptance criteria and evidence. Keep sequencing, integration, shared verification and delivery here; route independent review through `code-review`. Do not launch a fixed tree. If roles are unavailable, continue suitable local work and report the limit without rebuilding prompts or changing configuration.

1. Before publication, inspect CI triggers for draft, synchronize and readiness events. Identify local checks, provider-only evidence and extra cost. Automatic CI on the provider's own hosted runners is not extra cost, at any configured size and even when build minutes are billed. Third-party paid runners such as Blacksmith, expensive manually triggered suites and reruns of unchanged code are extra cost. Treat unclear cost as extra cost. Do not suppress checks.
2. Finish implementation and confirmed repairs, commit locally and resolve the PR base. Use `code-review` to simplify the full PR change, then establish independent standards and requirements/correctness assessments of the resulting code, including all branch commits. Preserve applicable review evidence and recheck only conclusions affected by later changes. Complete local validation, reusing valid results. Use `frontend-ui-validation` for web/native UI and keep its proof.
3. Prepare `pr-proof-pack` for the final diff. If publishing would start extra-cost jobs, defer it to step 5; otherwise push the reviewed branch, create or update Jesse's draft PR and publish the proof pack. For an approved dependent chain, discover `gh stack` commands and preserve each PR's gates.
4. Stop for Jesse's go-ahead only when the published draft has not started CI or the final CI includes extra cost; otherwise continue without asking. Give Jesse an inspection checkpoint at the stop, or in the step 6 report if there was no stop: any PR link, user-visible result, observed problem, key design decisions, local proof, platform gaps, review focus and final CI. At a stop, ask one short question that names any extra cost. Silence, a merge reaction or general delivery authority does not count. Resolve feedback and recheck affected evidence/review. Request revised go-ahead only if feedback materially changes the final CI.
5. Publish anything step 3 deferred, start any final CI that has not started and complete required checks without a routine question. If readiness triggers CI, mark ready only after local review, proof and conflict checks, include readiness in the final CI and report CI pending until verified. Diagnose failures and pass applicable local checks before justified reruns. Approval for one extra-cost run does not cover later ones; before any uncovered extra-cost run, explain why it is needed and request approval. Preserve provider-only limits and spending restrictions. For PRs targeting `openclaw/*`, follow `code-review`'s explicit ClawSweeper workflow before final CI where possible; disclose ordering conflicts in the inspection checkpoint.
6. When checks pass and no conflicts remain, mark ready if draft and report the result to Jesse. Do not merge.

Continue authorized local work through administrative checkpoints and diagnostic warnings. Leave a blocked PR draft and explain the problem, consequence, remaining work and alternative—not just counts or hashes.

Explain decisions plainly without routine citations to internal instructions; preserve required safety/approval disclosures.

## Permissions

Before GitHub writes, verify account `jesse-merhi` and Jesse's authorship of an existing PR.

No force-push, merge/automerge, deployment, destructive actions, labels, or reactions. The only allowed public comment is exactly `/clawsweeper re-review`, when required by step 5; no prose additions. Ask before new dependencies, breaking changes, or unrelated scope.
