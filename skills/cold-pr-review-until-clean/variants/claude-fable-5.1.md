---
name: cold-pr-review-until-clean
description: 'Repeat fresh cold reviews and fixes until the configured clean stop condition.'
---

# Cold PR review until clean

Finish when one fresh independent cold review returns zero actionable findings.
When a reviewer finds accepted issues, fix them and send the updated committed
target to a new isolated reviewer. In `code-review`, this phase follows native
Codex review unless it was unavailable or explicitly skipped. Use `cold-pr-review`,
not an OpenClaw-specific workflow or Clawsweeper.

1. Resolve the PR number, URL, branch, or range and exact committed `HEAD`.
   Refuse staged, unstaged, and untracked changes. Load `review-guardrails`,
   identify validation, and confirm the persisted scope baseline with
   `scope-status` before fixing. Inherit `code-review`'s budget, consult queue,
   and matching rules when present.
2. Load `wait-efficiently` and [subagent-dispatch.md](references/subagent-dispatch.md).
   Dispatch a fresh isolated reviewer for every pass whenever the harness supports
   subagents. Send only the target and neutral checklist. Prior review-flow,
   rubbish, TypeScript, architecture, cognitive-load, frontend, and finding-
   discipline work can supply neutral topics, never results or desired answers.
   Exclude rationale, prior findings, attempted fixes, and CI confidence.
3. Use the native event-driven wait. Keep useful independent coordinator work
   moving, without changing the reviewed tree. Match candidates to the findings
   registry only after the review returns.
4. Follow [loop.md](references/loop.md), maintaining `iterations` and
   `consecutive_clean`. Read [clean-criteria.md](references/clean-criteria.md)
   before counting a clean pass and
   [fixing-and-reporting.md](references/fixing-and-reporting.md) before edits/reporting.
5. Triage, apply only accepted targeted fixes directly or with the repo fix
   workflow, and validate affected behavior. Run `scope-check` after every
   accepted fix and stop on non-zero. Commit all accepted fixes from the pass
   together before dispatching the next reviewer. Batch independent checks,
   keeping dependent fix/validation/review stages ordered.
6. Record findings, commands, fixes, validation, consult changes, open queue,
   and stop reason in the findings CLI. Reset the clean counter for actionable
   findings. Do not substitute implementer judgment for a fresh pass or edit
   code between clean passes.
7. Queue consult-worthy findings and continue other fixes without silently
   resolving them. Queue-only matched passes can count toward the target but
   cannot give final clean. At the target with open consults, stop
   `blocked-on-consult`; do not repeat unchanged reviews.
8. Report one fresh clean pass with empty consult queue and present unblocked
   scope status, or an honest `blocked-on-consult`/`budget-expired` stop. Include
   recorded fixes, validation, queue, state path, and reason. Do not stop before
   a fresh result or add reviews beyond the target.

During long work, report a new review result, accepted fix, validation change,
or blocker. Keep tests and edits tied to accepted findings.
