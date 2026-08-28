---
name: review-until-clean
description: 'Run authorized native reviews and fixes until two fresh passes are clean.'
---

# Review until clean

Run the harness's own built-in review in a loop. Every time the review
surfaces actionable findings, fix only those findings and run the review again.

Stop after the selected engine produces **two consecutive clean runs** on the
same reviewed tree. This gives the native review loop one confirmation pass
after the first clean result without returning to the old unbounded streak.

This skill is separate from `cold-pr-review-until-clean`: the source of truth is
the harness's native review mode, not a custom prompt, `cold-pr-review`, a
repo-specific review command, or an ad hoc subagent.

Do not use this skill for a one-off read-only review. A plain `codex review`,
`/review`, or `/code-review`-style request should run once and report findings
without editing unless the user explicitly asks for the until-clean loop or
`code-review` has selected this as its native review phase.

## Non-negotiables

```yaml
review_tool: must invoke the selected engine's bare built-in review; do not substitute a self-review or ad hoc subagent
prompt_policy: pass only the review target; never reveal prior findings, checklists, desired verdicts, or rationale before the engine returns
fix_tool: apply targeted fixes directly, or use the repo-specific fix workflow when one exists
state_store: keep findings, commands, open queue, and stop reason in the findings CLI
scope_gate: inherit the persisted scope baseline; run scope-check after every accepted fix and stop immediately on non-zero
stop_condition: two consecutive runs with zero actionable findings
counter_reset: any actionable finding resets consecutive_clean to 0
no_early_exit: do not stop before a fresh engine run returns clean
no_self_review: do not decide the tree is clean without a fresh engine run
same_tree_for_clean_target: do not edit, stage, unstage, commit, or otherwise change the reviewed tree between clean passes
same_engine_for_clean_target: do not switch review engines during the loop
consult_findings: consult-worthy findings go to the consult queue; keep fixing other findings instead of waiting
queue_matched_passes: a pass whose only findings match the open consult queue counts toward the clean target but can never produce a final clean verdict
fixed_point: when the clean target is met and the consult queue is non-empty, suspend as blocked-on-consult; never keep re-running the engine on an unchanged tree
```

## Workflow

1. Pick one review engine.

   Read [references/engine-selection.md](references/engine-selection.md). If
   the selected engine is Codex, also read
   [references/codex-engine.md](references/codex-engine.md). If it is Claude,
   read [references/claude-engine.md](references/claude-engine.md).

2. Pre-flight the target.

   Confirm the target: uncommitted local diff, base branch, or commit SHA. Check
   engine availability, inspect the working tree, load `review-guardrails`,
   confirm the persisted scope budget with `scope-status`, and identify
   verification commands. Done when fixes will land in the intended checkout,
   the scope budget is ready, and no review checklist or implementation
   rationale will be fed to the engine.

3. Run the until-clean loop.

   Load `wait-efficiently`, then read [references/loop.md](references/loop.md).
   Maintain `consecutive_clean`, `iterations`, and `required_clean = 2`. Run the
   selected engine's bare review, triage with `finding-discipline`, fix
   actionable findings, record state in the findings CLI, and rerun until the
   clean target or an honest stop condition is reached.

4. Fix and verify findings.

   Read [references/fixing-and-reporting.md](references/fixing-and-reporting.md)
   before editing or reporting. Done when every fix maps to an actionable
   finding, affected validation has run, invalid findings are recorded with
   evidence, and final reporting includes the stop reason and review state path.

## Done means

- The selected engine's bare built-in review ran for each iteration.
- No custom prompt, output-format prompt, desired verdict, or prior rationale
  was passed to the engine.
- The required clean passes were met on the reviewed tree, or the loop stopped
  honestly with `blocked-on-consult`, `budget-expired`, or `ambiguous-review`.
- Findings, fixes, validation commands, consult-queue changes, and stop
  conditions are recorded in the findings CLI.
- Every accepted fix is followed by a passing `scope-check`, and the final scope
  status is not missing or blocked.
- No code was edited between clean passes.
- No final clean verdict is reported while the consult queue has open entries.

## Avoid

- replacing the engine's review with `spawn_agent`, `cold-pr-review`, a
  repo-specific review command, or manual judgment;
- switching engines mid-loop;
- re-reviewing an old immutable commit after fixes;
- counting your own rejection of a finding as a clean pass;
- silently fixing or rejecting consult-worthy findings;
- running more reviews on an unchanged tree beyond the clean target.
