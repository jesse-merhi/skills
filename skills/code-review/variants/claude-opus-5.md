---
name: code-review
description: 'Run authorized native and independent fix-and-rerun reviews for a PR, branch, commit, or diff.'
---

# Code review

Deliver a governed two-phase review of one committed target: external native
`review-until-clean`, then fresh in-chat `cold-pr-review-until-clean`, followed
by recorded closeout. Preserve both whole-target gates and required workers;
do not add an optional final verifier or a worker per overlapping lens.

## Target and durable limits

Resolve `<skill-dir>` to this directory. Default to native Codex review with
Astra at medium from either harness, using the bundled helper. Honor an explicit
engine/model choice and verify only the selected CLI and authentication. Do not
probe private catalogues. `review-until-clean` owns selection and effort conflicts;
a high-only Claude engine cannot satisfy medium-only work without user override.

Require a committed `HEAD` and empty `git status --porcelain` before scope setup
or review. Ask for dirty staged/unstaged/untracked work to be committed/discarded;
never manufacture a temporary snapshot. Record `iteration = 0`,
`last_reviewed_head`, base-plus-head `last_reviewed_target`, `repo_display_name`,
`findings_db_path` (normally `~/.local/state/agent-review-findings/reviews.sqlite`),
local `review_started`, original `baseline_diff`, request/target/behavior/owner
`scope_baseline`, empty `consult_queue`, `findings_registry`, and valid-count-ranked
`file_coverage`. Load `review-guardrails` and
[guardrails-and-scope.md](references/guardrails-and-scope.md):

```sh
review_findings_bin="<skill-dir>/scripts/review-findings"
"$review_findings_bin" schema
"$review_findings_bin" scope-start \
  --repo <repo> --repo-path <repo-root> --branch <branch> \
  --target <target> --base <base> --head <head> \
  --scope-summary "<request, behavior, and owner boundary>"
```

The schema governs records. Resume with `scope-status`. Preserve the first
branch/base LOC allowance across runs; reset only through explicitly authorized
user words recorded in `scope-authorize`.

## Complete discovery before filtering

Use [setup-and-lenses.md](references/setup-and-lenses.md) once for flow mapping,
required/applicable conditional lenses, Fowler smell baseline on the Standards
path, neutral cold-risk checklist, and validation. At least three substantially
independent runtime flows trigger [large-diff-slices.md](references/large-diff-slices.md)
before Phase 1; file count does not. For its custom discovery briefs, request all
genuine scoped candidates with evidence rather than actionable-only output.
The coordinator filters afterward and records rejections. Preserve slice limits,
coverage, and the ban on recursive reviewers. Run optional lenses locally unless
substantial and independent; combine overlapping lenses.

Read [findings-registry.md](references/findings-registry.md). Record every source
and disposition through the absolute helper. Use `speak-fking-english`'s reader
reset for finding cards and owner summary. Query coverage before dispatch and
prioritize least-covered changed files without telling cold reviewers counts
or verdicts. Identifiable substantive file assessment is attested once per
general/discovery/cold reviewer in an end-of-review batch. Current content identity
governs validity; coverage is prioritization, never a clean gate.

## Execute the required phases

Phase 1 is external native review, never an in-chat replacement. Load
`review-until-clean`, `wait-efficiently`,
[review-phase-rules.md](references/review-phase-rules.md), and the selected Codex
[codex-review-helper.md](references/codex-review-helper.md). Keep the native command
limited to target and model/effort configuration; do not inject a discovery
prompt. Capture each external
ID before waiting, collect terminal output, and archive before another invocation
or leaving the phase. Guarantee cleanup on errors, cancellation, expiry, or early
stop using `set_thread_archived` in Codex Desktop or `codex archive <id>` standalone.

After native meets its clean stop, use [subagents.md](references/subagents.md)
and `cold-pr-review-until-clean` in fresh in-chat subagents, not new top-level tasks.
Send frozen target and neutral risk checklist. Custom reviewers discover all
genuine scoped candidates before actionability filtering, without prior findings,
rationale, or desired verdicts. Use held native waits and match registry/consults
only after independent return. Do not append verifier workers.

Both loops own `finding-discipline`, the separate autonomous fix bar, targeted
repair, affected validation, per-fix `scope-check`, and pass-level commits.
Real findings are not automatic fixes. Do not patch follow-ups/out-of-scope work
or edit between clean passes. Native fixes stay native; cold fixes stay cold
unless the user explicitly requests a new native gate.

## Close out once the result is ready

After both gates, run full setup-selected local validation. If code changes,
repeat the affected phase and validation. With a clean committed final tree,
run final `scope-check` then `scope-complete`. Follow
[pr-closeout.md](references/pr-closeout.md) for owner/publication authority,
proof freshness, one final push, CI, and blockers. No remote branch/PR mutation
while either phase has findings or before full local validation passes.

Use [final-output.md](references/final-output.md) and `review-findings closeout`,
not chat memory. Report exact final SHA, phase results, findings/fixes,
verification, consultations, delivery/proof/CI status, and audit retrieval compactly.
Runtime records require path, reachability, likelihood, impact, consequence,
contract, root cause, repair, and intervention justification; the CLI derives
severity/`accept`. Maintenance records require current cost, root cause, and
intervention justification; repairs are also recorded for patched, deferred,
and approved-consult cases.

Stop honestly for missing engine/tools, blocked validation, budget/user stop,
unavailable subagents without accepted lower confidence, or open consults.
No "clean except" verdict. Keep repo bots, security remediation, OpenGrep, merge,
and advisory writing separate unless requested. `ask-codex`/`ask-claude` require
an explicit current request for that exact session and are not review fallbacks.
