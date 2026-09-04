---
name: cold-pr-review-until-clean
description: 'Repeat fresh cold reviews and fixes until the configured clean stop condition.'
---

# Cold PR review until clean

Run independent cold-review subagents in a loop. Every time a cold reviewer
surfaces actionable findings, fix only those findings and run another fresh
cold-review subagent.

Stop after **one fresh cold review invocation** completes with **zero actionable
findings**.

This skill is the normal-PR final independent review loop. In `code-review`, run
it after the Codex review phase unless Codex review is unavailable or explicitly
skipped. The source of truth here is `cold-pr-review`, not an OpenClaw-specific
review workflow or Clawsweeper. Fixes are handled directly by the implementing
agent unless a repo-specific fix workflow applies.

## Non-negotiables

```yaml
review_tool: must invoke cold-pr-review through an independent subagent whenever the harness supports subagents
review_context: subagent gets only the target and neutral review checklist; no prior rationale or findings
fix_tool: apply targeted fixes directly, or use the repo-specific fix workflow when one exists
state_store: keep findings, commands, open queue, and stop reason in the findings CLI
scope_gate: inherit the persisted scope baseline; run scope-check after every accepted fix and stop immediately on non-zero
stop_condition: one cold review run with zero actionable findings
counter_reset: any actionable finding resets consecutive_clean to 0
no_early_exit: do not stop before a fresh cold review returns clean
no_self_review: do not substitute the implementer's judgement for a cold review
fresh_reviewer: use a new isolated subagent for each review pass whenever the harness supports it
consult_findings: consult-worthy findings go to the consult queue; keep fixing other findings instead of waiting
queue_matched_passes: a pass whose only findings match the open consult queue counts toward the clean target but can never produce a final clean verdict
fixed_point: when the clean target is met and the consult queue is non-empty, suspend as blocked-on-consult; never keep re-running reviews on an unchanged tree
```

## Workflow

1. Pre-flight the target.

   Confirm the PR number, URL, branch, or git range and the exact committed
   `HEAD`. Refuse staged, unstaged, or untracked changes. Load
   `review-guardrails` and identify required verification commands. If running
   inside `code-review`, inherit the orchestrator's persisted scope budget,
   consult queue, and queue-matching rules. Confirm it with `scope-status`
   before fixing anything.

2. Build neutral reviewer context.

   If `code-review` already ran `review-flow-map`, `pr-rubbish-audit`,
   `typescript-discipline`, `improve-codebase-architecture`,
   `reducing-cognitive-load`, `frontend-ui-validation`, or
   `finding-discipline`, do not pass those results to the reviewer. Convert
   them only into neutral checklist topics.

3. Dispatch a fresh independent reviewer.

   Load `wait-efficiently`, then read
   [references/subagent-dispatch.md](references/subagent-dispatch.md). Done when
   a fresh isolated reviewer receives only the target and neutral review
   checklist, and the coordinator uses the native event-driven wait for its
   result. Match candidates against the findings registry only after the pass.

4. Run the until-clean loop.

   Read [references/loop.md](references/loop.md). Maintain
   `consecutive_clean` and `iterations`. Triage findings, fix actionable
   findings, record state in the findings CLI, and rerun with fresh reviewers
   until the clean target or an honest stop condition is reached.

5. Classify clean and report.

   Read [references/clean-criteria.md](references/clean-criteria.md) before
   counting a pass clean. Read
   [references/fixing-and-reporting.md](references/fixing-and-reporting.md)
   before editing or reporting.

## Done means

- Every review pass used a fresh isolated reviewer whenever the harness
  supported one.
- The reviewer did not receive prior findings, fixes already attempted, design
  rationale, CI confidence signals, desired verdicts, or earlier `code-review`
  results.
- One fresh cold review run completed with zero actionable findings on the
  reviewed tree, or the loop stopped honestly with `blocked-on-consult` or
  `budget-expired`.
- Findings, fixes, validation commands, consult-queue changes, and stop
  conditions are recorded in the findings CLI.
- Every accepted fix is followed by a passing `scope-check`, and the final scope
  status is not missing or blocked.
- Accepted fixes from one pass are committed together before the next reviewer.
- No code was edited between clean passes.
- No final clean verdict is reported while the consult queue has open entries.

## Avoid

- substituting the implementer's judgment for a cold review;
- leaking prior findings or implementation rationale into reviewer prompts;
- reviewing staged, unstaged, or untracked changes;
- stopping without a fresh clean cold-review pass;
- silently fixing or rejecting consult-worthy findings;
- running more reviews on an unchanged tree beyond the clean target.
