---
name: review-until-clean
description: 'Run authorized native reviews and fixes until two fresh passes are clean.'
---

# Review until clean

Reach two consecutive fresh clean native-engine passes on the same tree, fixing
only accepted findings. Keep that mandatory confirmation pass; do not append an
optional verifier or another review workflow. This loop runs only on explicit
until-clean authority or as `code-review`'s native phase. Ordinary `codex review`,
`/review`, or `/code-review` requests are one-off and read-only unless edits are authorized.

Preflight with [engine-selection.md](references/engine-selection.md) and the
selected [codex-engine.md](references/codex-engine.md) or
[claude-engine.md](references/claude-engine.md). Verify engine availability,
exact committed branch/base or SHA, intended fix checkout, and verification
commands. Refuse staged, unstaged, and untracked changes. Load `review-guardrails`,
inherit the persisted baseline, and confirm `scope-status`. Use `wait-efficiently`,
[loop.md](references/loop.md), and
[fixing-and-reporting.md](references/fixing-and-reporting.md).

The review call accepts its target and explicit model/effort configuration only.
Do not inject an Opus discovery
prompt, checklist, output format, prior findings, rationale, or desired verdict.
Do not substitute self-review, cold review, custom prompts, repo commands, or
ad hoc subagents. `ask-codex`/`ask-claude` need the user's explicit current request
for that exact cross-harness session.

Maintain `iterations`, `consecutive_clean`, and `required_clean = 2`. Triage all
returned candidates with `finding-discipline`. Record findings, commands, fixes,
validation, consult changes, open queue, and stop reason in the findings CLI.
Apply targeted accepted fixes directly or with the repository fix workflow.
After every accepted fix run `scope-check` and stop immediately on non-zero.
Run affected validation and commit the pass's fixes together before reviewing
the updated target, not an old immutable commit.

Actionable findings reset the clean counter. Your rejection of a finding is not
a clean engine pass. Keep the engine fixed and do not edit, stage, unstage,
commit, or otherwise change the tree between clean passes. Queue consult-worthy
findings without silently fixing/rejecting them and continue other fixes.
Queue-only matched passes count toward the target but cannot yield final clean;
at the target with an open queue, stop `blocked-on-consult` rather than looping
on unchanged code.

Close with the review state path, findings/fixes, validation, and stop reason.
Clean requires two fresh qualifying passes, an empty consult queue, and present
unblocked scope status. Otherwise use the honest `blocked-on-consult`,
`budget-expired`, or `ambiguous-review` outcome. Keep the closeout concise and
stop when the defined conditions are met.
