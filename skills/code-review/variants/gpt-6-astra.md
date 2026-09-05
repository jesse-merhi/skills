---
name: code-review
description: 'Run authorized native and independent fix-and-rerun reviews for a PR, branch, commit, or diff.'
---

# Code review

Carry one authorized target through native review, then independent cold review,
and evidence-backed closeout. Resolve the selected engine and routine execution
from the request and harness. Preserve real scope, consult, publication, and
clean-tree gates; do not ask again about settled review authority.

## Freeze identity and authority

Resolve `<skill-dir>` to this directory. Default to native Codex review with
Astra at medium from either harness, using the bundled helper. Preserve an
explicit engine/model selection and verify only that CLI's authentication.
Do not probe private catalogues. `review-until-clean` owns selection and effort
conflicts; a high-only engine cannot silently override medium-only work.

Require committed `HEAD` and empty `git status --porcelain` before setup or either
phase. Dirty staged/unstaged/untracked work needs the user's commit/discard decision;
review does not certify a temporary snapshot.

Record `iteration = 0`, exact `last_reviewed_head`, base-plus-head
`last_reviewed_target`, `repo_display_name`, `findings_db_path` (normally
`~/.local/state/agent-review-findings/reviews.sqlite`), local `review_started`,
original `baseline_diff`, request/target/behavior/owner `scope_baseline`, empty
`consult_queue`, `findings_registry`, and valid-count-ranked `file_coverage`.
Read [guardrails-and-scope.md](references/guardrails-and-scope.md), load
`review-guardrails`, and establish the persisted baseline:

```sh
review_findings_bin="<skill-dir>/scripts/review-findings"
"$review_findings_bin" schema
"$review_findings_bin" scope-start \
  --repo <repo> --repo-path <repo-root> --branch <branch> \
  --target <target> --base <base> --head <head> \
  --scope-summary "<request, behavior, and owner boundary>"
```

Use the schema as the record contract. Resumption uses `scope-status`; repeated
runs retain the branch/base's first authorized LOC and remaining allowance.
Only explicit authorization captured through `scope-authorize` may reset it.

## Prepare the evidence owners

Read [setup-and-lenses.md](references/setup-and-lenses.md). Map flows, complete
required lenses, run or mark conditional lenses inapplicable, consider the Fowler
smell baseline on the Standards path, build a neutral cold-risk checklist, and
select validation. At three or more substantially independent runtime flows,
read [large-diff-slices.md](references/large-diff-slices.md) before Phase 1 and
use its required workers. File count alone is not a slicing trigger.

Read [findings-registry.md](references/findings-registry.md). Record all user,
lens, native, and cold findings and accepted/rejected/deferred/provisional/reopened
states. Load `speak-fking-english`'s reader reset for each finding-card batch and
owner summary. Before dispatch, query coverage and prioritize least-covered
changed files without leaking prior verdicts or counts. General/discovery/cold
reviewers attest assessed files once in an end-of-review batch when identifiable.
Content identities govern current validity; coverage cannot replace whole-target gates.

## Keep each phase responsible for its loop

Phase 1 uses external `review-until-clean`, not an in-chat reviewer. Load
`wait-efficiently`, [review-phase-rules.md](references/review-phase-rules.md), and
[codex-review-helper.md](references/codex-review-helper.md) when Codex is selected.
Capture every external ID before waiting and archive after terminal state/output
capture, before another invocation or leaving the phase. Guarantee cleanup on
failure, cancellation, budget expiry, and early stop using `set_thread_archived`
in Codex Desktop or `codex archive <id>` for standalone sessions.

Only after the native clean stop, read [subagents.md](references/subagents.md)
and run `cold-pr-review-until-clean` in fresh in-chat subagents. This phase does
not create top-level tasks. Supply frozen target and neutral checklist only,
wait natively through `wait-efficiently`, then match returned candidates against
the registry and consult queue. Prior findings and rationale remain hidden.

Each loop owns `finding-discipline`, the separate autonomous fix bar, repair,
affected validation, `scope-check` after accepted fixes, and pass-level commits.
Continue authorized fixes without renewed generic approval; consult-worthy issues
retain their user gate. Do not patch follow-up/out-of-scope work or edit between
clean passes. Native fixes return to native; cold fixes return to fresh cold.
Re-enter Phase 1 only for an explicit request for a fresh native gate.

## Complete the actual final tree

After native passed and cold is clean on the final target, run full selected
local validation. A code change requires the affected phase and validation again.
On a clean committed tree, run final `scope-check`, then `scope-complete`.
[pr-closeout.md](references/pr-closeout.md) controls ownership, publication,
proof freshness, the single final push, CI, and PR blockers. No remote PR/branch
mutation while findings remain or before final local validation passes.

Use [final-output.md](references/final-output.md) and database-backed
`review-findings closeout`. Name exact final SHA, native/cold results,
findings/fixes, verification, consults, delivery/proof/CI status, and audit retrieval.
Runtime records include path, reachability, likelihood, impact, consequence,
contract, root cause, repair, and intervention justification; CLI severity and
`accept` come from risk. Maintenance records include current cost, root cause,
and intervention justification, plus repair for patched/deferred/approved-consult cases.

Stop without clean for missing engine/tools, blocked validation, budget/user stop,
subagents unavailable without accepted lower confidence, or open consults. Report
PR/proof blockers separately. Repo bots, security remediation, OpenGrep, merge,
and advisory writing need explicit scope. `ask-codex`/`ask-claude` need the current
user's explicit request for that exact session, not an inferred review fallback.
