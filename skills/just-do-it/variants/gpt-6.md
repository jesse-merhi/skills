---
name: just-do-it
description: 'Finish a proposed change and deliver a reviewed PR ready for Jesse.'
---

# Just Do It

When explicitly invoked, finish the change and deliver one PR ready for Jesse.

Check code, PR and review/test evidence. Start at the first unfinished or invalidated step; reuse still-applicable results.

Delegate per AGENTS.md; use `code-review` for review.

1. Before publication, map the CI and automatic review jobs that draft, synchronize and readiness events start to their local commands, runtime versions, flags and scope selectors. Note which checks only the provider or platform can run. Do not suppress checks.
2. Finish implementation and confirmed repairs, commit locally and resolve the PR base. Use `code-review` to simplify the full PR change, then run its council on the resulting code, including all branch commits. Preserve applicable review evidence and route affected rechecks through code-review’s existing round record. If code-review stops for a user decision, report it and keep the PR draft. A complete code-review of the current revision satisfies review; proceed when proof and checks also pass. Before every push or event that starts CI, pass the locally reproducible checks mapped in step 1 on the code being published. Use the same commands and relevant configuration as CI; a narrower test selection does not prove a broader CI job. Reuse still-applicable results and rerun checks whose inputs changed. Stop on a local failure and diagnose it before publication. Use `frontend-ui-validation` for web/native UI and keep its proof.
3. Prepare `pr-proof-pack` for the final diff. Once local validation and review pass, push the reviewed branch, create or update Jesse's draft PR and publish the proof pack. Explicit invocation authorizes the repository's configured automatic PR CI and review jobs on draft, synchronize and readiness events, including paid Blacksmith runners; do not ask again because those jobs cost money or their billing is unclear. For an approved dependent chain, discover `gh stack` commands and preserve each PR's gates.
4. Check in with Jesse in the step 6 report, or when a concrete blocker needs his decision: any PR link, user-visible result, observed problem, key design decisions, local commands and results, platform gaps, review focus and final CI. Report provider- and platform-only checks as remaining CI evidence, with the available local coverage; do not claim they passed locally. If a required locally reproducible check is blocked, resolve its prerequisite or check in about that specific validation gap before the event that starts CI. Do not stop solely because a draft has not started CI. Resolve feedback and recheck affected evidence before the next publication event; review rechecks follow step 2.
5. Complete required checks. If readiness triggers CI, mark ready only after the local validation, review, proof and conflict checks, and report CI pending until verified. Diagnose CI failures, repair confirmed defects and pass the affected local checks before publishing a fix. Do not dispatch, rerun, re-push or change readiness merely to obtain green results on unchanged code. Preserve provider-only limits and spending restrictions. For PRs targeting `openclaw/*`, follow `code-review`'s explicit ClawSweeper workflow before final CI where possible; disclose ordering conflicts in the check-in.
6. When checks pass and no conflicts remain, mark ready if draft. Complete [runtime release](#release-runtimes-at-task-completion) before the final report to Jesse. Do not merge.

Continue authorized local work through administrative checkpoints and diagnostic warnings. Leave a blocked PR draft and explain the problem, consequence, remaining work and alternative—not just counts or hashes.

Explain decisions plainly without routine citations to internal instructions.

## Release runtimes at task completion

Record the runtimes this task starts and their stop commands. Release them per [cleanup](../cleanup/SKILL.md) only when the whole task is done: implementation, review, required checks and proof. Waiting on CI or review and handing off unfinished work are not completion points. Keep resources Jesse still needs for manual testing, report what you stopped or retained, and carry ownership and stop instructions into any handoff.

## Permissions

Before GitHub writes, verify account `jesse-merhi` and Jesse's authorship of an existing PR.

No force-push, merge/automerge, deployment, labels or reactions. The only allowed public comment is exactly `/clawsweeper re-review`, when step 5 requires it. List unrelated scope as follow-ups.
