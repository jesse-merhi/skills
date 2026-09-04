---
name: cold-pr-review-until-clean
description: 'Repeat fresh cold reviews and fixes until the configured clean stop condition.'
---

# Cold PR review until clean

Finish one fresh independent cold-review invocation with zero actionable findings,
or an honest governed stop. Preserve each required fresh pass; do not add an
optional final verifier. In `code-review`, this is the normal-PR final phase
after native Codex review unless unavailable or explicitly skipped. Use
`cold-pr-review`, not OpenClaw review or Clawsweeper.

Preflight the PR/URL/branch/range and exact committed `HEAD`; refuse staged,
unstaged, or untracked changes. Load `review-guardrails`, identify validation,
inherit the persisted scope baseline and consult rules, and confirm `scope-status`.
Use the orchestrator's budget and queue when present. Load `wait-efficiently`,
[loop.md](references/loop.md), [clean-criteria.md](references/clean-criteria.md),
and [fixing-and-reporting.md](references/fixing-and-reporting.md).

Build each new isolated reviewer's neutral brief from
[subagent-dispatch.md](references/subagent-dispatch.md)'s scope and evidence
requirements. Request discovery of every genuine scoped candidate before filtering,
then separate accepted findings from audit-only rejections. Omit the template's
additional sweep and recursive verifier workers; complete changed-flow coverage
and the verdict are the endpoint. Use fresh subagents whenever supported.
Send only target and neutral checklist. Earlier flow, rubbish, TypeScript,
architecture, cognitive-load, frontend, or finding-discipline results may supply
topics, never outcomes. Exclude rationale, prior findings, attempted fixes,
CI confidence, and desired verdicts. Wait natively; registry matching happens
only after the pass.

Maintain `iterations` and `consecutive_clean`. Triage returned candidates, apply
only targeted accepted fixes directly or via the repo fix workflow, run
`scope-check` after each accepted fix, and stop immediately on non-zero. Validate
affected behavior and commit the pass's fixes together before the next reviewer.
Record findings, commands, fixes, validation, consult changes, queue, and stop
reason in the findings CLI.

Actionable findings reset the counter. Implementer judgment cannot substitute
for a fresh review, and code must not change between clean passes. Queue
consult-worthy findings without silently fixing/rejecting them; continue other
fixes. Queue-only matched passes count toward the target but never final clean.
At the target with open consults, stop `blocked-on-consult` rather than repeating
reviews on the unchanged tree.

Clean requires one fresh qualifying invocation, an empty consult queue, and
present unblocked scope status. Otherwise report `blocked-on-consult` or
`budget-expired`. Keep the closeout to state path, findings/fixes, validation,
queue, and stop reason, and do not continue beyond the defined fixed point.
