---
name: review-until-clean
description: 'Run authorized native reviews and fixes until two fresh passes are clean.'
---

# Review until clean

Run the harness's native review until two consecutive fresh clean passes cover
the same tree. This is an authorized fix loop, not a one-off review. A plain
`codex review`, `/review`, or `/code-review` request runs once without edits
unless the user requests the loop or `code-review` selects it as its native phase.

1. Read [engine-selection.md](references/engine-selection.md) and the chosen
   [codex-engine.md](references/codex-engine.md) or
   [claude-engine.md](references/claude-engine.md). Select one engine for the
   whole loop. Confirm availability, exact committed branch/base or SHA, intended
   fix checkout, and verification commands. Refuse staged, unstaged, or untracked changes.
2. Load `review-guardrails`. Inherit the persisted scope baseline and run
   `scope-status` before fixing. Load `wait-efficiently`,
   [loop.md](references/loop.md), and
   [fixing-and-reporting.md](references/fixing-and-reporting.md).
3. Set `required_clean = 2` and maintain `iterations` and `consecutive_clean`.
   Invoke the selected engine's bare built-in review with only the target.
   Do not add a checklist, output-format prompt, earlier findings, rationale,
   or desired verdict. Do not replace it with a custom prompt, self-review,
   cold review, repo review command, or ad hoc subagent. Cross-harness `ask-codex`
   or `ask-claude` requires the user's explicit request for that exact session.
4. After the result, triage with `finding-discipline`. Record findings, commands,
   fixes, validation, consult changes, open queue, and stop reason in the findings
   CLI. Batch independent checks around the result, not dependent loop stages.
5. Fix only accepted actionable findings directly or with the repo's fix workflow.
   Run `scope-check` after each accepted fix; stop immediately on non-zero.
   Validate affected behavior and commit the pass's accepted fixes together
   before the next review. Review the updated tree, not an old immutable commit.
6. Reset the clean count to zero on actionable findings. Do not count your own
   rejection as a clean engine pass. Between clean passes, do not edit, stage,
   unstage, commit, or otherwise change the tree, and do not change engines.
7. Put consult-worthy findings in the consult queue and continue other fixes.
   Do not silently fix or reject them. A pass matching only the open queue may
   count toward the target but never gives final clean. Once the target is met
   with an open queue, stop `blocked-on-consult` instead of re-reviewing unchanged code.
8. Finish with two qualifying fresh clean passes, an empty consult queue, and
   present unblocked final scope status; otherwise state `blocked-on-consult`,
   `budget-expired`, or `ambiguous-review`. Report the state path, findings/fixes,
   validation, and stop reason. Do not exit before a fresh result or add runs
   after the fixed point.

During long work, report fresh review results, accepted fixes, validation changes,
or blockers. Keep edits and tests limited to accepted findings.
