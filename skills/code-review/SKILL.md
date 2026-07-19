---
name: code-review
description: 'Orchestrate the native and independent until-clean review phases for a PR, branch, commit, or diff. Use only when the user authorizes a fix-and-rerun review workflow.'
---

# Code Review

Orchestrate two until-clean review phases for one target.

1. Phase 1: run `review-until-clean` until the harness-native review is clean.
2. Phase 2: run `cold-pr-review-until-clean` in a subagent until cold review is
   clean.

Use `finding-discipline` throughout both phases. Phase 1 must satisfy the
native clean stop condition before Phase 2 begins. Phase 2 must then stay in
the cold-review loop until cold review is clean on the final target after the
last accepted cold-review fix and affected validation.

Phase 1 uses the harness-native review engine: bare `codex review` in Codex,
the built-in `code-review` workflow in Claude Code. If the user names an
engine, that engine wins. `review-until-clean` owns engine selection and
fallback rules.

Keep separate unless explicitly requested: repo-specific review bots, security
remediation workflows, OpenGrep, merge, and advisory writing.

## Workflow

1. Resolve `<skill-dir>` to the directory containing this `SKILL.md`.

2. Select the review engine, then run its model gate.

   Use the harness-native engine unless the user explicitly names another:
   Codex in Codex, Claude in Claude Code. Treat an explicit request for Fable
   as selecting Claude. Do not ask about or validate the unselected engine.

   Read [references/model-gate.md](references/model-gate.md), then run:

   ```sh
   <skill-dir>/scripts/check-review-models --engine <codex|claude>
   ```

   Done when the gate passes. If it cannot complete or reports stale model
   assumptions, stop before Phase 1 and ask the user how to proceed.

3. Freeze the target and review scope.

   Record:

   ```text
   iteration = 0
   last_reviewed_head = <current HEAD or PR head SHA>
   last_reviewed_target = <base + HEAD + dirty-tree/snapshot identity>
   repo_display_name = <readable repo name, such as sample-app>
   findings_db_path = <local SQLite path, normally ~/.local/state/agent-review-findings/reviews.sqlite>
   review_started = <local timestamp>
   baseline_diff = <changed files and changed lines of the original target>
   scope_baseline = <request, target, intended behavior, owner boundary, files>
   consult_queue = []
   findings_registry = <SQLite findings database>
   ```

   Read [references/guardrails-and-scope.md](references/guardrails-and-scope.md)
   for scope classification, budgets, consult queue, tracked-finding notices,
   and blocked-on-consult behavior. Done when `review-guardrails` is loaded and
   the baseline is recorded.

4. Run one-time setup for the current target.

   Read [references/setup-and-lenses.md](references/setup-and-lenses.md). Done
   when the changed surface is mapped, required lenses have run, conditional
   lenses have run or been marked not applicable, the Fowler smell baseline has
   been considered on the Standards path, the neutral cold-review risk checklist
   exists, and validation targets are known.

5. Prepare the findings registry.

   Read [references/findings-registry.md](references/findings-registry.md).
   Done when the review-findings helper path is resolved and every accepted,
   rejected, deferred, provisional, reopened, user, lens, native-review, and
   cold-review finding can be recorded instead of reconstructed from chat.

6. Run Phase 1.

   Load `review-until-clean` and run it until the native review is clean on the
   current target. Use `finding-discipline` to triage findings before fixing.
   Read [references/review-phase-rules.md](references/review-phase-rules.md)
   for whole-target review, dirty-tree snapshots, validation, structured review
   classification, and quiet-helper behavior. If Phase 1 uses the Codex engine,
   also read [references/codex-review-helper.md](references/codex-review-helper.md).

7. Run Phase 2.

   Read [references/subagents.md](references/subagents.md), then run
   `cold-pr-review-until-clean` in a subagent until cold review is clean on the
   same target. Give it the one-time setup summary, neutral risk checklist, and
   any tracked-finding notices generated from currently open consult entries.

8. After an accepted Phase 1 finding:

   - apply the fix in the real checkout;
   - record the finding and fix in the findings database;
   - run affected validation and record each command;
   - inspect the diff and check the diff-growth budget;
   - return to Phase 1.

9. After an accepted Phase 2 finding:

   - apply the fix in the real checkout;
   - record the finding and fix in the findings database;
   - run affected validation and record each command;
   - inspect the diff and check the diff-growth budget;
   - stay in Phase 2 and dispatch the next fresh cold reviewer;
   - do not return to Phase 1 unless the user explicitly asks for a fresh
     native gate.

10. Close out only after the Phase 1 native gate has passed and Phase 2 is
    clean on the final target.

   Read [references/pr-closeout.md](references/pr-closeout.md) for PR creation
   or update, evidence, `pr-proof-pack`, pending GitHub Actions, and PR blockers.
   Read [references/final-output.md](references/final-output.md) before the
   final response.

## Done Means

- The required model gate passed for this run.
- `review-surface-map`, required lenses, applicable conditional lenses,
  `review-guardrails`, and `finding-discipline` were used.
- Native review met its clean stop condition before Phase 2, and cold review
  met its clean stop condition on the final target and dirty-tree/snapshot
  identity.
- Every accepted finding, rejected finding, deferred finding, provisional fix,
  verification command, consult-queue entry, and stop reason is recorded through
  the findings CLI.
- Final validation for the affected surfaces passed, or blockers and residual
  risk are explicit.
- The PR-capable target has reviewer-checkable proof from `pr-proof-pack`, or
  the PR/proof blocker is reported separately from the review result.
- The final answer is backed by `review-findings closeout`, not chat memory.

## Stop Honestly

Stop without claiming clean when tools are unavailable, the model gate fails,
validation is blocked, budgets expire, the user stops the run, subagents are
unavailable and the user has not accepted lower confidence, or the consult queue
still has open entries.

There is no "clean except" final verdict. The result is clean only after the
consult queue is resolved.

## Avoid

- switching or overriding the review model without user approval;
- substituting self-review, ad hoc prompts, or one-off subagents for the two
  configured phases;
- patching follow-up or out-of-scope findings into this PR;
- leaking prior findings or desired conclusions into cold reviewers;
- editing between clean passes in either phase;
- returning from Phase 2 to Phase 1 after cold-review fixes unless explicitly
  requested;
- leaving accepted fixes in a temporary snapshot instead of the real checkout;
- pushing just to review;
- writing final closeout sections from chat history.
