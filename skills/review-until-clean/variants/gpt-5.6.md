---
name: review-until-clean
description: 'Run authorized native reviews and fixes until two fresh passes are clean.'
---

# Review until clean

Run one selected native review engine until two consecutive fresh clean passes
cover the same tree. Fix only accepted actionable findings. This loop requires
an explicit until-clean request or selection as `code-review`'s native phase.
A plain `codex review`, `/review`, or `/code-review` request runs once, read-only
unless edits are separately authorized.

## Preflight

Read [engine-selection.md](references/engine-selection.md), then the selected
[codex-engine.md](references/codex-engine.md) or
[claude-engine.md](references/claude-engine.md). Confirm an exact committed branch
against its base or a commit SHA, the intended fix checkout, engine availability,
and verification commands. Refuse staged, unstaged, or untracked changes.
Load `review-guardrails`, inherit the persisted scope baseline, and confirm it
with `scope-status` before fixing.

Load `wait-efficiently` and [loop.md](references/loop.md). Read
[fixing-and-reporting.md](references/fixing-and-reporting.md) before edits/reporting.

## Execute and record the loop

Use only the selected engine's built-in review with its target and explicit
model/effort configuration.
Never supply checklists, output prompts, prior findings, rationale, or desired
verdicts. Do not substitute custom review prompts, self-review, cold review,
repo-specific review commands, or ad hoc subagents. `ask-codex`/`ask-claude` are
not fallbacks unless the current user explicitly requested that exact session.

Maintain `iterations`, `consecutive_clean`, and `required_clean = 2`. Triage
returned candidates with `finding-discipline`. Record findings, commands, fixes,
validation, consult changes, open queue, and stop reason in the findings CLI.
Apply targeted accepted fixes directly or through the repository's fix workflow.
Run `scope-check` after every accepted fix and stop immediately on non-zero.
Validate affected behavior and commit one pass's accepted fixes together before
the next review. Review the updated target, not an old immutable commit.

Actionable findings reset the clean counter to zero. A rejected finding is not
a fresh clean engine pass. Keep one engine throughout and do not edit, stage,
unstage, commit, or otherwise change the tree between clean passes.

Queue consult-worthy findings without silently fixing or rejecting them; continue
other authorized fixes. Passes containing only matches to the open consult queue
may count toward the target, but cannot yield final clean. At the target with
an open queue, stop `blocked-on-consult` instead of repeating unchanged reviews.

## Closeout

Report clean only after two fresh qualifying passes on the same tree, no open
consults, and a present unblocked final scope status. Otherwise report the honest
stop: `blocked-on-consult`, `budget-expired`, or `ambiguous-review`. Include review
state path, findings/fixes, validation, and stop reason. Do not stop early or
extend the loop past its fixed point with discretionary verification.
