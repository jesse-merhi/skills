---
name: cold-pr-review-until-clean
description: 'Repeat fresh cold reviews and fixes until the configured clean stop condition.'
---

# Cold PR review until clean

Reach one fresh independent cold-review pass with zero actionable findings.
Fix accepted findings and dispatch a new reviewer until that condition or an
honest stop. In `code-review`, this final normal-PR phase follows native Codex
review unless unavailable or explicitly skipped. Its source is `cold-pr-review`,
not OpenClaw review or Clawsweeper.

Confirm the PR/URL/branch/range and exact committed `HEAD`. Refuse staged,
unstaged, or untracked changes. Load `review-guardrails`, identify validation,
inherit the persisted scope baseline and consult rules, and run `scope-status`
before fixes. Within `code-review`, reuse its budget and queue.

Load `wait-efficiently` and [subagent-dispatch.md](references/subagent-dispatch.md).
Every pass uses a fresh isolated `cold-pr-review` subagent whenever supported,
with only the target and neutral checklist. Convert prior review-flow, rubbish,
TypeScript, architecture, cognitive-load, frontend, and finding-discipline work
into neutral topics only. Do not send results, rationale, attempted fixes, CI
confidence, or desired verdicts. Use native event-driven waiting and match
candidates to the findings registry only after the pass.

Follow [loop.md](references/loop.md), maintaining `iterations` and
`consecutive_clean`. Before counting clean read
[clean-criteria.md](references/clean-criteria.md); before edits/reporting read
[fixing-and-reporting.md](references/fixing-and-reporting.md). Triage findings,
make targeted accepted fixes directly or through the repo fix workflow, validate,
and commit one pass's accepted fixes together before the next reviewer.
Run `scope-check` after every accepted fix and stop immediately on non-zero.
Record findings, commands, fixes, validation, consult changes, queue, and stop
reason in the findings CLI.

An actionable finding resets the counter. Never substitute implementer judgment
for a fresh cold pass or change code between clean passes. Queue consult-worthy
findings and continue other fixes; do not silently fix or reject them. A pass
whose findings only match open consults can count toward the target, but cannot
produce final clean. At the target with a nonempty queue, stop `blocked-on-consult`
instead of re-running the unchanged tree.

Report one fresh clean invocation with no open consults and present unblocked
scope status, or an honest `blocked-on-consult`/`budget-expired` stop. Include the
findings state, fixes, validation, queue, and reason. Do not stop before a fresh
result or add reviews beyond the defined fixed point.
