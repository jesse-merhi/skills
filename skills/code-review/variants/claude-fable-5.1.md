---
name: code-review
description: 'Run authorized native and independent fix-and-rerun reviews for a PR, branch, commit, or diff.'
---

# Code review

Complete native review and then independent cold review for the same committed
target. Use targeted fixes for accepted findings and preserve every scope,
consultation, validation, and publication gate.

1. Resolve `<skill-dir>` to this directory. Select native Codex review with
   Astra at medium from either harness, using the bundled helper. An explicit
   engine/model choice wins. Verify only the selected CLI and authentication;
   do not probe private catalogues. `review-until-clean` owns selection and
   effort conflicts. Do not invoke the high-only Claude engine for medium work.
2. Require a committed `HEAD` and empty `git status --porcelain` before scope
   setup or review. For staged, unstaged, or untracked work, ask for it to be
   committed or discarded. Do not manufacture a temporary review snapshot.
3. Record `iteration = 0`, `last_reviewed_head`, base-plus-head
   `last_reviewed_target`, `repo_display_name`, `findings_db_path` (normally
   `~/.local/state/agent-review-findings/reviews.sqlite`), local `review_started`,
   original `baseline_diff`, `scope_baseline` (request/target/behavior/owner),
   empty `consult_queue`, `findings_registry`, and current valid `file_coverage`.
   Read [guardrails-and-scope.md](references/guardrails-and-scope.md), load
   `review-guardrails`, and run:

   ```sh
   review_findings_bin="<skill-dir>/scripts/review-findings"
   "$review_findings_bin" schema
   "$review_findings_bin" scope-start \
     --repo <repo> --repo-path <repo-root> --branch <branch> \
     --target <target> --base <base> --head <head> \
     --scope-summary "<request, behavior, and owner boundary>"
   ```

   Treat the schema as authoritative. Resume with `scope-status`. Preserve the
   branch/base's first authorized LOC allowance across runs; resetting it requires
   explicit user words recorded with `scope-authorize`.
4. Apply [setup-and-lenses.md](references/setup-and-lenses.md) once: map changed
   flows, complete required lenses, run or mark conditional lenses inapplicable,
   consider Fowler smells on the Standards path, prepare neutral risk topics,
   and identify validation. If at least three substantially independent runtime
   flows exist, read [large-diff-slices.md](references/large-diff-slices.md)
   before Phase 1. Many files alone do not justify slicing. Batch independent
   reads and check current or unfamiliar behavior against its source.
5. Read [findings-registry.md](references/findings-registry.md). Record user,
   lens, native, and cold findings plus accepted, rejected, deferred, provisional,
   and reopened dispositions through the absolute helper. Use
   `speak-fking-english`'s reader reset for finding cards and the final summary.
   Query coverage before dispatch and prioritize least-covered changed files
   without revealing counts or prior verdicts. General, discovery, and cold
   reviewers record substantively assessed files once in a final batch when
   identifiable. Current content identity governs validity; coverage is not a clean gate.
6. Run Phase 1 through `review-until-clean` in an external native session, never
   an in-chat substitute. Load `wait-efficiently`,
   [review-phase-rules.md](references/review-phase-rules.md), and for Codex
   [codex-review-helper.md](references/codex-review-helper.md). Record each created
   task/session ID before waiting. On terminal state, capture output and archive
   before another invocation or leaving the phase. Guarantee cleanup on errors,
   cancellation, budget expiry, and early stop too. Use `set_thread_archived`
   in Codex Desktop or `codex archive <id>` for standalone sessions.
7. Only after the native clean stop, read [subagents.md](references/subagents.md)
   and run `cold-pr-review-until-clean` via fresh in-chat subagents, not top-level
   tasks. Give only frozen target and neutral risk checklist, excluding earlier
   findings or rationale. Use held event-driven waits. Match returned candidates
   to the registry and consult queue only after independent completion.
8. Let each phase own triage through `finding-discipline`, the `review-guardrails`
   autonomous fix bar, repair, affected validation, `scope-check` after each
   accepted fix, and pass-level commits. Real findings are not automatic fixes.
   Phase 1 fixes return to Phase 1; Phase 2 fixes return to a new cold reviewer.
   Do not return to native review unless the user requests it. Do not edit between
   clean passes or patch out-of-scope/follow-up work into the PR.
9. After cold is clean on the final target, run full setup-selected local validation.
   If code changes, repeat the affected phase and validation. On the clean
   committed tree run final `scope-check` and `scope-complete`. Follow
   [pr-closeout.md](references/pr-closeout.md) for ownership/publication authority,
   proof freshness, one final push, CI, and blockers. Do not mutate a remote
   branch/PR while either phase has findings or before final local validation passes.
10. Follow [final-output.md](references/final-output.md) and use
    `review-findings closeout`, not chat memory. Name exact final SHA, both phases,
    findings/fixes, verification, consultations, delivery/proof/CI limits, and full
    audit retrieval. Runtime records need path, reachability, likelihood, impact,
    consequence, contract, root cause, repair, and intervention justification;
    the CLI derives severity/`accept`. Maintenance records need current cost,
    root cause, and intervention justification. Patched, deferred, and approved-
    consult records need recommended repair.

Keep repo bots, security remediation, OpenGrep, merge, and advisory writing
separate unless requested. Never use `ask-codex`/`ask-claude` without the current
user's explicit request for that exact session. Stop honestly for unavailable
tools/engine, blocked validation, budget/user stop, unavailable subagents without
accepted lower confidence, or open consults. Do not report "clean except".
Report meaningful phase, evidence, fix, or blocker changes during long work.
