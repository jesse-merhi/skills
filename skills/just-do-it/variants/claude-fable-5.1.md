---
name: just-do-it
description: 'Finish a proposed change and deliver a reviewed PR ready for Jesse.'
---

# Just Do It

When explicitly invoked, finish the change and deliver one PR ready for Jesse.

Check code, PR and review/test evidence. Start at the first unfinished or invalidated step; reuse still-applicable results.

For useful independent work, use `Agent` with `subagent_type`: "investigator" for questions and "implementer" for bounded changes and focused tests. Supply objective, worktree and revision or source, scope, constraints, acceptance criteria and evidence. Keep sequencing, integration, shared verification and delivery here; route independent review through `code-review`. Do not launch a fixed tree. If roles are unavailable, continue suitable local work and report the limit without rebuilding prompts or changing configuration.

1. Before publication, inspect CI and automatic review triggers for draft, synchronize and readiness events. Map the jobs each event will start to their local commands, runtime versions, flags and scope selectors. Separate locally reproducible checks from provider- or platform-only checks. Do not suppress checks.
2. Finish implementation and confirmed repairs, commit locally and resolve the PR base. Use `code-review` to simplify the full PR change, then establish independent standards and requirements/correctness assessments of the resulting code, including all branch commits. Preserve applicable review evidence and recheck only conclusions affected by later changes. Before every push or event that starts CI, pass the locally reproducible checks mapped in step 1 on the code being published. Use the same commands and relevant configuration as CI; a narrower test selection does not prove a broader CI job. Reuse still-applicable results and rerun checks whose inputs changed. Stop on a local failure and diagnose it before publication. Use `frontend-ui-validation` for web/native UI and keep its proof.
3. Prepare `pr-proof-pack` for the final diff. Once local validation and review pass, push the reviewed branch, create or update Jesse's draft PR and publish the proof pack. Explicit invocation authorizes the repository's configured automatic PR CI and review jobs on draft, synchronize and readiness events, including paid Blacksmith runners; do not ask again because those jobs cost money or their billing is unclear. Ask before new paid services or extra manually triggered campaigns and runs not already authorized. For an approved dependent chain, discover `gh stack` commands and preserve each PR's gates.
4. Give Jesse an inspection checkpoint in the step 6 report, or when a concrete blocker needs his decision: any PR link, user-visible result, observed problem, key design decisions, local commands and results, platform gaps, review focus and final CI. Report provider- and platform-only checks as remaining CI evidence, with the available local coverage; do not claim they passed locally. If a required locally reproducible check is blocked, resolve its prerequisite or obtain Jesse's approval for that specific validation gap before the event that starts CI. Do not stop solely because a draft has not started CI. Resolve feedback and recheck affected evidence/review before the next publication event.
5. Complete required checks. If readiness triggers CI, mark ready only after the local validation, review, proof and conflict checks, and report CI pending until verified. Diagnose CI failures, repair confirmed defects and pass the affected local checks before publishing a fix. Do not dispatch, rerun, re-push or change readiness merely to obtain green results on unchanged code. Ask before an extra manual run not already authorized, explaining why it is needed. Preserve provider-only limits and spending restrictions. For PRs targeting `openclaw/*`, follow `code-review`'s explicit ClawSweeper workflow before final CI where possible; disclose ordering conflicts in the inspection checkpoint.
6. When checks pass and no conflicts remain, mark ready if draft and report the result to Jesse. Do not merge.

Continue authorized local work through administrative checkpoints and diagnostic warnings. Leave a blocked PR draft and explain the problem, consequence, remaining work and alternative—not just counts or hashes.

Explain decisions plainly without routine citations to internal instructions; preserve required safety/approval disclosures.

## Permissions

Before GitHub writes, verify account `jesse-merhi` and Jesse's authorship of an existing PR.

No force-push, merge/automerge, deployment, destructive actions, labels, or reactions. The only allowed public comment is exactly `/clawsweeper re-review`, when required by step 5; no prose additions. Ask before new dependencies, breaking changes, or unrelated scope.
