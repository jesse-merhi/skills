---
name: review-until-clean
description: 'Run authorized native reviews and fixes until two fresh passes are clean.'
---

# Review until clean

Complete the authorized native review loop: two consecutive fresh clean passes
from one engine on one unchanged tree. This requirement is not optional extra
testing. A one-off `codex review`, `/review`, or `/code-review` request stays one
read-only run unless an until-clean loop is requested or selected by `code-review`.

## Establish the engine and governed target

Read [engine-selection.md](references/engine-selection.md) and the applicable
[codex-engine.md](references/codex-engine.md) or
[claude-engine.md](references/claude-engine.md). Resolve the exact clean committed
branch/base or commit SHA, engine availability, intended fix checkout, and
verification commands. Refuse staged, unstaged, and untracked changes.
Load `review-guardrails`, inherit its persisted scope baseline, and confirm
`scope-status`. Load `wait-efficiently`, [loop.md](references/loop.md), and
[fixing-and-reporting.md](references/fixing-and-reporting.md).

## Run and respond under existing authority

Maintain `iterations`, `consecutive_clean`, and `required_clean = 2`. Call the
selected built-in engine with the review target and explicit model/effort
configuration. No checklist, output
prompt, prior finding, rationale, or desired verdict may enter that call. Neither
self-review, cold review, repo review commands, custom prompts, nor ad hoc subagents
can substitute. `ask-codex` or `ask-claude` requires a current explicit request
for that exact cross-harness session.

Triage each result with `finding-discipline`. Record findings, commands, fixes,
validation, consult changes, queue, and stop reason in the findings CLI. Apply
only accepted findings directly or with the repo's fix workflow; run `scope-check`
after every accepted fix and stop on non-zero. Validate affected behavior and
commit a pass's accepted fixes together before reviewing the updated target.
Do not repeatedly review an old immutable SHA after fixing it.

Continue the already-authorized loop without repeated permission questions.
Consult-worthy findings remain user decisions: queue them, continue independent
fixes, and never silently fix or reject them.

## Apply the exact stop rules

Any actionable finding resets the clean counter. Rejecting a finding yourself
cannot replace a fresh clean engine result. Keep the same engine and make no
edit, stage, unstage, commit, or other tree change between clean passes.
Queue-only matched passes can count toward the target but never make the final
verdict clean. At the target with an open queue, suspend `blocked-on-consult`;
do not rerun an unchanged tree beyond that fixed point.

A clean closeout needs two fresh qualifying passes, empty consult queue, and a
present unblocked scope status. Otherwise report `blocked-on-consult`,
`budget-expired`, or `ambiguous-review`, with state path, findings/fixes, validation,
and stop reason. Preserve these mandatory checks without adding unrelated validation.
