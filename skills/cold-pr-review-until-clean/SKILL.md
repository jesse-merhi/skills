---
name: cold-pr-review-until-clean
description: 'Run independent cold-review subagents on a PR, branch, or diff, fix actionable findings, and repeat until the configured clean stop condition is met.'
---

# Cold PR Review Until Clean

Run independent cold-review subagents in a loop. Every time a cold reviewer
surfaces actionable findings, fix only those findings and run another fresh
cold-review subagent.

Stop only after **three consecutive cold review invocations** complete with
**zero actionable findings**.

This skill is the normal-PR final independent review loop. In `code-review`, run
it after the Codex review phase unless Codex review is unavailable or explicitly
skipped. The source of truth here is `cold-pr-review`, not an OpenClaw-specific
review workflow or Clawsweeper. Fixes are handled directly by the implementing
agent unless a repo-specific fix workflow applies.

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

## Workflow

1. Pre-flight the target.

   Confirm the PR number, URL, branch, git range, or local diff. Check the
   working tree, load `review-guardrails`, and identify required verification
   commands. If running inside `code-review`, inherit the orchestrator's
   budgets, consult queue, and queue-matching rules.

2. Build neutral reviewer context.

   If `code-review` already ran `review-surface-map`, `pr-rubbish-audit`,
   `typescript-discipline`, `improve-codebase-architecture`,
   `reducing-cognitive-load`, `frontend-ui-validation`, or
   `finding-discipline`, do not pass those results to the reviewer. Convert
   them only into neutral checklist topics.

3. Dispatch a fresh independent reviewer.

   Read [references/subagent-dispatch.md](references/subagent-dispatch.md).
   Done when a fresh isolated reviewer receives only the target, neutral review
   checklist, and tracked-finding notices generated per `review-guardrails`.

4. Run the until-clean loop.

   Read [references/loop.md](references/loop.md). Maintain
   `consecutive_clean` and `iterations`. Triage findings, fix actionable
   findings, record state in the findings CLI, and rerun with fresh reviewers
   until the clean streak or an honest stop condition is reached.

5. Classify clean and report.

   Read [references/clean-criteria.md](references/clean-criteria.md) before
   counting a pass clean. Read
   [references/fixing-and-reporting.md](references/fixing-and-reporting.md)
   before editing or reporting.

## Done Means

- Every review pass used a fresh isolated reviewer whenever the harness
  supported one.
- The reviewer did not receive prior findings, fixes already attempted, design
  rationale, CI confidence signals, desired verdicts, or earlier `code-review`
  results.
- Three consecutive cold review runs completed with zero actionable findings on
  the same tree, or the loop stopped honestly with `blocked-on-consult` or
  `budget-expired`.
- Findings, fixes, validation commands, consult-queue changes, and stop
  conditions are recorded in the findings CLI.
- No code was edited between clean passes.
- No final clean verdict is reported while the consult queue has open entries.

## Avoid

- substituting the implementer's judgment for a cold review;
- leaking prior findings or implementation rationale into reviewer prompts;
- stopping on one or two clean passes;
- silently fixing or rejecting consult-worthy findings;
- running more reviews on an unchanged tree beyond the streak requirement.
