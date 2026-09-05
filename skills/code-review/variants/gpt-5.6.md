---
name: code-review
description: 'Run authorized native and independent fix-and-rerun reviews for a PR, branch, commit, or diff.'
---

# Code review

Orchestrate two governed fix-and-rerun phases on one committed target:
`review-until-clean` in an external native session, then
`cold-pr-review-until-clean` through fresh in-chat subagents. Native must meet its
clean stop before cold begins; cold must be clean on the final target after its
last fix and affected validation. `finding-discipline` establishes actionability;
`review-guardrails` separately decides whether a real finding merits an autonomous fix.

## Freeze the target and budget

Resolve `<skill-dir>` to this skill's directory. Use the current harness's native
engine—bare `codex review` in Codex, built-in `code-review` in Claude—unless the
user names another. A named Claude model selects Claude. Check only the selected
engine. For Codex confirm the current runtime identity can resolve/authenticate
the standalone CLI. Keep the harness-configured model; do not probe private
catalogues or override models. `review-until-clean` owns selection/fallback rules.

Require committed `HEAD` and empty `git status --porcelain` before `scope-start`
or review. If dirty, ask for staged/unstaged/untracked work to be committed or
discarded; never create or certify a temporary snapshot.

Record `iteration = 0`, `last_reviewed_head`, `last_reviewed_target` (base + head),
`repo_display_name`, `findings_db_path` (normally
`~/.local/state/agent-review-findings/reviews.sqlite`), `review_started`, original
`baseline_diff`, `scope_baseline` (request/target/behavior/owner), `consult_queue = []`,
`findings_registry`, and changed-file `file_coverage` ranked by valid review count.
Read [guardrails-and-scope.md](references/guardrails-and-scope.md), load
`review-guardrails`, and persist/inherit the first authorized branch/base baseline:

```sh
review_findings_bin="<skill-dir>/scripts/review-findings"
"$review_findings_bin" schema
"$review_findings_bin" scope-start \
  --repo <repo> --repo-path <repo-root> --branch <branch> \
  --target <target> --base <base> --head <head> \
  --scope-summary "<request, behavior, and owner boundary>"
```

The schema is authoritative. Resume with `scope-status`, not a new baseline.
Repeated runs inherit the original LOC allowance; only explicit user authorization
recorded through `scope-authorize` may reset it.

## Prepare evidence once

Follow [setup-and-lenses.md](references/setup-and-lenses.md): map changed flows,
run required lenses, run or mark conditional lenses inapplicable, consider the
Fowler smell baseline on the Standards path, prepare neutral cold-review risk
topics, and select validation. Read [large-diff-slices.md](references/large-diff-slices.md)
once before Phase 1 only if at least three substantially independent runtime
flows exist; file count alone does not justify slicing.

Read [findings-registry.md](references/findings-registry.md). Record user, lens,
native, and cold findings and all accepted/rejected/deferred/provisional/reopened
states through the absolute helper. Use `speak-fking-english`'s reader reset for
finding-card batches and the owner summary. Query coverage before dispatch,
prioritize least-covered changed files, and never disclose prior verdicts or
counts to cold reviewers. General/discovery/cold reviewers that can identify
substantively assessed files record one end-of-review batch. Content identities
determine validity; coverage never substitutes for whole-target gates.

## Run the owning phases

Load `review-until-clean`, `wait-efficiently`, and
[review-phase-rules.md](references/review-phase-rules.md), plus
[codex-review-helper.md](references/codex-review-helper.md) for Codex. Phase 1 is
external native review, never an in-chat substitute. Capture each external task/
session ID before waiting. After terminal state and captured output, archive it
before another invocation or leaving the phase, including error, cancellation,
budget expiry, and early stop. Use `set_thread_archived` in Codex Desktop or
`codex archive <id>` for standalone sessions; make cleanup guaranteed.

For Phase 2 read [subagents.md](references/subagents.md) and invoke
`cold-pr-review-until-clean` with only frozen target and neutral risk checklist.
Use in-chat subagents, not another top-level task. Wait through `wait-efficiently`;
match registry and consult candidates only after independent return.

Each owning loop handles actionability, autonomous repair, affected validation,
`scope-check` after every accepted fix, and pass-level commits. Phase 1 fixes
return to native review; Phase 2 fixes return to a fresh cold reviewer. Return
to Phase 1 only if the user requests a fresh native gate. Never edit between
clean passes or patch follow-up/out-of-scope findings into this PR.

## Close out from recorded evidence

After both gates, run full selected local validation. If it changes code, rerun
the affected phase and validation. On the clean committed final tree, run final
`scope-check`, then `scope-complete`. Read [pr-closeout.md](references/pr-closeout.md)
for the PR owner/publication gate, proof freshness, one final push, CI, and blockers.
No remote branch/PR mutation is permitted while either phase has findings or
before final local validation passes. Keep repo bots, security remediation,
OpenGrep, merge, and advisory writing separate unless requested. `ask-codex` and
`ask-claude` are never review fallbacks without an explicit current request for
that exact cross-harness session.

Follow [final-output.md](references/final-output.md) and rebuild the answer from
`review-findings closeout`, not chat memory. Include exact final committed SHA,
phase results, findings/fixes, validation, consults, delivery/proof/CI blockers,
and retrievable audit. Runtime records need production path, reachability,
likelihood, impact, consequence, contract, root cause, repair, and intervention
justification; the CLI derives severity and `accept`. Maintenance records need
current cost, root cause, and intervention justification; patched, deferred,
and approved-consult records also need recommended repair.

Stop honestly for unavailable engine/tools, blocked validation, budget/user stop,
missing subagents without accepted lower confidence, or open consults. No "clean
except" verdict. Separate PR/proof blockers from review status and never claim
file coverage or chat recollection as the clean gate.
