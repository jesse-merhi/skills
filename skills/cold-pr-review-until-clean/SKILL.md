---
name: cold-pr-review-until-clean
description: 'Run independent cold-review subagents on a PR, branch, or diff, fix actionable findings, and repeat until the configured clean stop condition is met.'
---

# Cold PR Review Until Clean

Run independent cold-review subagents in a loop. Every time a cold
reviewer surfaces actionable findings, fix only those findings and run
another fresh cold-review subagent. Stop only after **three consecutive
cold review invocations** complete with **zero actionable findings**.

This skill is the normal-PR final independent review loop. In
`code-review`, run it after the Codex review phase unless Codex review is
unavailable or explicitly skipped. The source of truth here is
`cold-pr-review`, not an OpenClaw-specific review workflow or Clawsweeper.
Fixes are handled directly by the implementing agent unless a repo-specific fix
workflow applies.

## Non-Negotiables

```yaml
review_tool: must invoke cold-pr-review through an independent subagent whenever the harness supports subagents
review_context: subagent gets only the target, the neutral review checklist, and tracked-finding notices generated per review-guardrails; no other prior rationale or findings
fix_tool: apply targeted fixes directly, or use the repo-specific fix workflow when one exists
state_store: keep findings, commands, open queue, and stop reason in the findings CLI
stop_condition: 3 consecutive cold review runs with zero actionable findings
counter_reset: any actionable finding resets consecutive_clean to 0
no_early_exit: do not stop on 1 or 2 clean passes
no_self_review: do not substitute the implementer's judgement for a cold review
fresh_reviewer: use a new isolated subagent for each review pass whenever the harness supports it
consult_findings: consult-worthy findings go to the consult queue; keep fixing other findings instead of waiting
queue_matched_passes: a pass whose only findings match the open consult queue counts toward the streak but can never produce a final clean verdict
fixed_point: when the streak is met and the consult queue is non-empty, suspend as blocked-on-consult; never keep re-running reviews on an unchanged tree
```

## Pre-Flight

Before the first cold review:

1. Confirm the target: PR number, URL, branch, git range, or local diff.
2. Check the working tree and note local changes that may affect fixes.
3. Load `review-guardrails`. When running inside `code-review`, the
   orchestrator's budgets, consult queue, and queue-matching rules
   apply; standalone, set them up directly from that skill. A budget stop is
   an honest stop, not a failure. There is no iteration cap: the budgets are
   the bound.
4. Identify required verification commands, but do not feed CI status or
   prior implementation rationale into the cold reviewer.
5. If `code-review` already ran `review-surface-map`, `pr-rubbish-audit`,
   `typescript-discipline`,
   `improve-codebase-architecture`, `reducing-cognitive-load`,
   `frontend-ui-validation`, or `finding-discipline`, do not pass those
   results to the reviewer. Convert them only into neutral checklist topics.

If the repo is dirty, make sure fixes will land in the right checkout.
For local CLI work, use the user's normal isolation rules before editing
unless they explicitly asked to stay in the current checkout.

## The Loop

Maintain two integers across the whole session:

```text
consecutive_clean = 0
iterations = 0
```

Repeat:

```text
1. If the wall-clock budget has expired:
     Record stop reason `budget-expired` in the findings CLI or final report.
     STOP and report unresolved state honestly.
2. iterations += 1
   Track the phase, iteration, target, reviewed head, and current clean streak.
3. Invoke cold-pr-review against the target.
   - Use a fresh subagent.
   - Pass only target + review checklist.
4. Triage the findings:
   - reject only with recorded evidence
   - uncertain findings -> provisional-fix test (review-guardrails):
       pass -> fix now, log Provisional, ask the user without waiting
       fail -> consult queue (Class B), ask the user without waiting
   - findings matching an open queue entry -> match note, no new entry
   If open questions for the user have reached consult_cap ->
     Record the open queue and stop reason `blocked-on-consult`.
     SUSPEND as blocked-on-consult: present all open questions and wait.
5. Classify the review:
   - clean              -> no findings, or only evidence-rejected ones
   - clean-except-queue -> every remaining finding matches the open queue
   - has_findings       -> at least one actionable finding remains
6. If clean or clean-except-queue:
     consecutive_clean += 1
     Track the run verdict and clean streak.
     If consecutive_clean >= 3:
       If the consult queue is empty -> record stop reason `3-consecutive-clean`,
               then STOP and report success.
       Else -> record stop reason `blocked-on-consult`,
               then SUSPEND as blocked-on-consult: present the queue and wait
               for the user. Do not run more reviews on this unchanged
               tree.
     Else -> go to step 1 without editing anything.
7. If has_findings:
     consecutive_clean = 0
     Fix the actionable findings with narrow edits.
     Run relevant verification for the fixes.
     Record each command, result, and reason with the findings CLI.
     Inspect the diff so the fix maps to the findings, then check the
     diff-growth budget.
     Keep fixed-finding details in the findings CLI.
     Go to step 1.
```

Resume after the user answers a suspended loop:

- Any accepted finding -> fix it, close its queue entry, reset
  `consecutive_clean` to 0, and go to step 1 on the changed tree.
- All open entries rejected -> record the decisions; the completed streak
  already covered this exact tree, so STOP with success citing those
  rejections.

Between consecutive clean reviews, **do not edit code**. The streak is
only meaningful if independent reviewers are looking at the same tree.

## Subagents Are Required

Use a fresh subagent for every cold-review pass whenever the harness can
spawn one. The loop is designed to fight implementer anchoring bias; a
self-review inside the implementation context does not provide the same
signal.

- In Codex, use `spawn_agent` with a tightly scoped review prompt.
- In Claude Code, use the `Task` tool with a code-reviewer or general
  reviewer subagent.
- In other harnesses, use the closest isolated reviewer agent/workspace.

Only fall back to self-review when the harness truly has no subagent or
isolated reviewer mechanism. If you fall back, state that explicitly and
treat the pass as lower-confidence in the final report.

## Invoking The Reviewer

Use the `cold-pr-review` skill's pattern: dispatch an isolated reviewer
with no implementation context. In Codex, use `spawn_agent`; in Claude
Code, use `Task`; in other harnesses, use the closest isolated reviewer
mechanism available.

Use a prompt like:

```text
Review PR #<number> on this repository. Run `gh pr view <number>` and
`gh pr diff <number>` to understand what it does. Read any files you
need for context. First map the changed flows, entrypoints, contracts,
side effects, and validation targets. Check for unrelated diff rubbish,
architecture issues, cognitive load, and React state ownership issues.
Check TypeScript type boundaries, API/client contracts, schemas, casts,
`any`, `unknown`, and ts-ignore usage when TypeScript changed. Apply security
and UI lenses when the diff touches those surfaces. Report only concrete
actionable findings tied to changed code or contracts, then give a merge
verdict.
```

For local branches or diffs:

```text
Review the changes in git range `<base>...HEAD` in this repository.
Read any files you need for context. First map the changed flows,
entrypoints, contracts, side effects, and validation targets. Check for
unrelated diff rubbish, architecture issues, cognitive load, and React
state ownership issues. Check TypeScript type boundaries, API/client
contracts, schemas, casts, `any`, `unknown`, and ts-ignore usage when
TypeScript changed. Apply security and UI lenses when the diff touches those
surfaces. Report only concrete actionable findings tied to changed code or
contracts, then give a merge verdict.
```

You may add domain-specific checklist items, such as security-sensitive
flows, UI states to inspect, migration safety, or concurrency concerns.
You may also append tracked-finding notices for open Class B findings,
generated fresh from the findings database per `review-guardrails` — that is
the only prior-finding content allowed. Do not include:

- Any other prior reviewer findings
- Fixes already attempted
- Design rationale
- "CI is passing" or similar confidence signals
- A desired verdict
- Results from earlier `code-review` passes

## What Counts As Clean

Treat a cold review run as clean only when:

- The reviewer reports zero actionable issues.
- Critical and important findings are always actionable.
- Minor findings count as actionable when the reviewer says they should
  be fixed before merge, or when they indicate a real bug, regression,
  missing test, unsafe behavior, or confusing user experience.
- Nits, optional style suggestions, and "consider" items do not reset
  the counter unless they reveal a real defect.
- A run whose only findings match the open consult queue is
  `clean-except-queue`: it counts toward the streak, but the loop suspends
  as blocked-on-consult instead of reporting a clean verdict while the
  queue is open.
- An errored, ambiguous, incomplete, or wrong-target review is not clean.

When in doubt, treat the run as `has_findings`. Extra review cycles are
cheaper than falsely declaring convergence.

## Fixing Findings

- Fix only what maps to actionable cold-review findings.
- Prefer the smallest change that addresses the reviewer's concern.
- Do not bundle unrelated cleanup into the fix step.
- Run the relevant tests, typechecks, linters, or UI validation for the
  changed surface before the next cold review.
- Record why each added or changed test catches a reachable product, API,
  workflow, security, or data regression in the related finding record.
- Inspect the diff after fixing so you can confirm the next reviewer is
  seeing the intended tree.
- If a finding is invalid, document why and run another cold review. Do
  not count your rejection as a clean pass by itself.

## Reporting

Narrate one short line per iteration:

```text
iter 1: cold review -> 3 findings -> fixed
iter 2: cold review -> 1 finding  -> fixed
iter 3: cold review -> clean (1/3)
iter 4: cold review -> clean (2/3)
iter 5: cold review -> 1 finding  -> counter reset
iter 6: cold review -> clean (1/3)
iter 7: cold review -> clean (2/3)
iter 8: cold review -> clean (3/3)
```

On termination, report:

- Final iteration count
- Stop reason: `3-consecutive-clean`, `blocked-on-consult`, or
  `budget-expired`
- Last cold-review summary and merge verdict
- Findings fixed directly
- Findings intentionally rejected as invalid, with rationale
- Consult-queue findings awaiting the user, with their finding records
- Verification commands and results

## Hard Rules

- Always run a cold review for each iteration.
- Never claim success before 3 consecutive clean passes.
- Never edit between clean passes.
- Always reset the counter on any actionable finding.
- Record findings, fixes, verification commands, consult-queue changes, and
  stop conditions in the findings CLI.
- Use a fresh reviewer for each pass when possible.
- In `code-review`, run `review-until-clean` before this skill
  unless the native review engine is unavailable or explicitly skipped.
- Do not leak previous findings or implementation rationale into the
  review prompt.
- Respect the wall-clock and diff-growth budgets from `review-guardrails`.
- Route consult-worthy findings through the consult queue; keep fixing
  other findings instead of waiting, and do not silently fix or reject
  them.
- Never run more reviews on an unchanged tree beyond the streak
  requirement; suspend as blocked-on-consult instead.
- Never report a fully clean verdict while the consult queue has open
  entries.
- A machine-local override may change budget values for one machine; it
  does not remove the budgets.
