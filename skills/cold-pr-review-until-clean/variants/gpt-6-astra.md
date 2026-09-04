---
name: cold-pr-review-until-clean
description: 'Repeat fresh cold reviews and fixes until the configured clean stop condition.'
---

# Cold PR review until clean

Carry the authorized cold-review loop through one fresh independent pass with
zero actionable findings. In `code-review`, this follows native Codex review
unless unavailable or explicitly skipped. The reviewer workflow is `cold-pr-review`,
not OpenClaw review or Clawsweeper.

## Establish the governed target

Resolve the PR/URL/branch/range and exact committed `HEAD`. Refuse staged,
unstaged, and untracked changes. Load `review-guardrails`, identify validation,
inherit the persisted scope baseline, and confirm `scope-status` before fixing.
Reuse the orchestrator's budget, consult queue, and matching rules when present.
Read `wait-efficiently`, [subagent-dispatch.md](references/subagent-dispatch.md),
[loop.md](references/loop.md), [clean-criteria.md](references/clean-criteria.md),
and [fixing-and-reporting.md](references/fixing-and-reporting.md) before their stages.

## Obtain independent evidence and act on it

Dispatch the required fresh isolated reviewer directly for each pass whenever
subagents are supported. Give only the target and neutral checklist. Prior flow,
rubbish, TypeScript, architecture, cognitive-load, frontend, or finding-discipline
results may become neutral topics, never leaked outcomes. Exclude rationale,
prior findings, fixes attempted, CI confidence, and desired verdicts. Use the
native event-driven wait and match candidates to the registry only after return.

Maintain `iterations` and `consecutive_clean`. Triage and fix only accepted findings,
directly or with the repo's fix workflow. Run `scope-check` after every accepted
fix and stop on non-zero. Validate affected behavior and commit a pass's accepted
fixes together before the next fresh review. Record findings, commands, fixes,
validation, consult changes, queue, and stop reason in the findings CLI.

Continue under existing loop authority without asking on each iteration.
Consult-worthy issues stay in the user-decision queue; continue independent
fixes instead of waiting, and do not silently fix or reject consults.

## Stop at the actual fixed point

Actionable findings reset the clean counter. A fresh reviewer result, not the
implementer's judgment, determines the pass; make no code changes between clean
passes. Queue-only matched results can count toward the target but never give
final clean. At the target with an open queue, suspend `blocked-on-consult` rather
than re-reviewing unchanged code.

Clean needs one fresh qualifying pass, no open consults, and present unblocked
scope status. Otherwise report `blocked-on-consult` or `budget-expired`, with
state path, fixes, validation, queue, and reason. Preserve the mandatory fresh
pass without adding discretionary reviews after completion.
