---
name: code-review
description: 'Run authorized native and independent fix-and-rerun reviews for a PR, branch, commit, or diff.'
---

# Code review

Complete both review phases and every required closeout step. Batch independent
reads and checks. During long review runs, report phase changes, new evidence,
accepted fixes, and blockers. Verify current or unfamiliar behavior from source.
Keep fixes targeted to accepted findings and do not add unrelated tests or
rewrites.

Orchestrate two until-clean review phases for one target.

1. Phase 1: run `review-until-clean` in an external harness-native review
   session until native review is clean. Never substitute an in-chat subagent.
2. Phase 2: run `cold-pr-review-until-clean` in an in-chat subagent until cold
   review is clean. Do not create a separate top-level task for this phase.

Use `finding-discipline` and `review-guardrails`' autonomous fix bar throughout
both phases. A finding can be real without deserving an autonomous fix. Phase 1
must satisfy the native clean stop condition before Phase 2 begins. Phase 2 must
then stay in the cold-review loop until cold review is clean on the final target
after the last accepted cold-review fix and affected validation.

Phase 1 uses the harness-native review engine: bare `codex review` in Codex,
the built-in `code-review` workflow in Claude Code. If the user names an
engine, that engine wins. `review-until-clean` owns engine selection and
fallback rules.

Treat every external native-review session as temporary. Capture its task or
session ID when it is created, collect its result, then archive it in guaranteed
cleanup on success, failure, cancellation, or early stop. In Codex Desktop use
`set_thread_archived`; for standalone Codex sessions use `codex archive <id>`.
Do not rely on the final response to remember cleanup, and do not leave the
review task visible after its result has been incorporated.

Keep separate unless explicitly requested: repo-specific review bots, security
remediation workflows, OpenGrep, merge, and advisory writing.

`ask-codex` and `ask-claude` are user-invoked cross-harness tools, not review
engines or fallback reviewers. Never invoke either skill from this workflow
unless the current user explicitly requests that exact cross-harness session.

## Workflow

1. Resolve `<skill-dir>` to the directory containing this `SKILL.md`.

2. Select the review engine.

   Use the harness-native engine unless the user explicitly names another:
   Codex in Codex, Claude in Claude Code. Treat an explicit request for Fable
   as selecting Claude. Do not ask about or validate the unselected engine.
   When Codex is selected, confirm the current runtime identity can resolve and
   authenticate the standalone Codex CLI before review.

   Use the model configured by the selected harness. Do not hard-code or
   probe private model catalogues before review; the native command owns model
   availability and reports an actionable failure when its configuration is
   invalid.

3. Freeze the target and review scope.

   Record:

   ```text
   iteration = 0
   last_reviewed_head = <current HEAD or PR head SHA>
   last_reviewed_target = <base + committed HEAD>
   repo_display_name = <readable repo name, such as sample-app>
   findings_db_path = <local SQLite path, normally ~/.local/state/agent-review-findings/reviews.sqlite>
   review_started = <local timestamp>
   baseline_diff = <changed files and changed lines from the branch's first
                    user-authorized review baseline for this base branch>
   scope_baseline = <request, target, intended behavior, owner boundary>
   consult_queue = []
   findings_registry = <SQLite findings database>
   file_coverage = <changed files ranked by current valid review count>
   ```

   Require `HEAD` to resolve to a commit and `git status --porcelain` to be
   empty before `scope-start` or either review phase. Stop and ask for the
   staged, unstaged, and untracked changes to be committed or discarded when
   the checkout is dirty. Review never creates or certifies a temporary
   snapshot of uncommitted code.

   Read [references/guardrails-and-scope.md](references/guardrails-and-scope.md)
   for scope classification, budgets, consult queue, queue matching,
   and blocked-on-consult behavior. For a new run, persist or inherit the branch
   baseline before any review fix. A later run on the same branch and base must
   keep the first authorized LOC baseline and its remaining allowance;
   completing and restarting review never grants a fresh buffer:

   ```sh
   review_findings_bin="<skill-dir>/scripts/review-findings"
   "$review_findings_bin" schema
   "$review_findings_bin" scope-start \
     --repo <repo> --repo-path <repo-root> --branch <branch> \
     --target <target> --base <base> --head <head> \
     --scope-summary "<request, behavior, and owner boundary>"
   ```

   Treat `schema` output as the authoritative finding-record contract. On a
   resumed run, use `scope-status`; never rerun `scope-start` to move the
   baseline. Done when `review-guardrails` is loaded and the CLI has persisted
   the baseline.

4. Run one-time setup for the current target.

   Read [references/setup-and-lenses.md](references/setup-and-lenses.md). Done
   when the changed flows are mapped, required lenses have run, conditional
   lenses have run or been marked not applicable, the Fowler smell baseline has
   been considered on the Standards path, the neutral cold-review risk checklist
   exists, and validation targets are known.

5. Prepare the findings registry.

   Read [references/findings-registry.md](references/findings-registry.md).
   Load `speak-fking-english` and use its reader reset for each batch of finding
   cards and for the final owner summary.
   Done when the review-findings helper path is resolved and every accepted,
   rejected, deferred, provisional, reopened, user, lens, native-review, and
   cold-review finding can be recorded instead of reconstructed from chat.
   Query current file coverage before dispatching review agents, and give the
   least-covered changed files priority without describing prior verdicts or
   review counts to a cold reviewer. Every general, discovery, or cold reviewer
   that can identify the files it substantively assessed must record them once,
   in one batch, at the end of its review.

6. Run Phase 1.

   Load `review-until-clean` and `wait-efficiently`, then run the native review
   externally until it is clean on the current target. Record every created
   external task or session ID before waiting. After each invocation reaches a
   terminal state and its output has been captured, archive it before starting
   another invocation or leaving Phase 1. Run the same cleanup after errors,
   cancellation, budget expiry, or an early stop. Use `finding-discipline` and
   the autonomous fix bar to triage findings before fixing. Read
   [references/review-phase-rules.md](references/review-phase-rules.md) for
   whole-target review, validation, finding classification, and held-wait
   behavior. If Phase 1 uses the Codex engine,
   also read [references/codex-review-helper.md](references/codex-review-helper.md).

7. Run Phase 2.

   Read [references/subagents.md](references/subagents.md), then run
   `cold-pr-review-until-clean` in a subagent until cold review is clean on the
   same target. Give it only the frozen target and neutral risk checklist.
   After it returns candidates, compare them with the findings registry and
   consult queue during coordinator triage; do not reveal prior findings before
   the reviewer has independently completed its pass.
   Wait through `wait-efficiently` so completion wakes the active wait instead
   of being discovered by status polling.

8. Let the owning phase loop handle accepted findings.

   `review-until-clean` and `cold-pr-review-until-clean` own the shared
   actionability, repair, validation, scope-check, and pass-level commit
   sequence. From Phase 1, return to Phase 1. From Phase 2, dispatch the next
   fresh cold reviewer and do not return to Phase 1 unless the user explicitly
   asks for a fresh native gate.

9. Close out only after the Phase 1 native gate has passed and Phase 2 is
    clean on the final local target.

   Run the full local validation selected during setup. If it changes code,
   rerun the affected review phase and validation. Once the final tree is clean
   and validated, run one final `scope-check`, then `scope-complete` with the
   clean phase result so a later user-authorized review can start. Read
   [references/pr-closeout.md](references/pr-closeout.md) for the final PR-owner
   gate, one final push, proof freshness, GitHub Actions, and PR blockers.
   Read [references/final-output.md](references/final-output.md) before the
   final response. Record the exact final committed head in
   the closeout so a later PR workflow can detect whether the review is current.

## Done means

- The selected harness-native review engine started successfully with its
  configured model.
- Every external native-review task or session created by Phase 1 was archived
  after its result was captured, including failed, cancelled, and superseded
  invocations.
- `review-flow-map`, required lenses, applicable conditional lenses,
  `review-guardrails`, and `finding-discipline` were used.
- Native review met its clean stop condition before Phase 2, and cold review
  met its clean stop condition on the final committed target.
- Every accepted finding, rejected finding, deferred finding, provisional fix,
  verification command, consult-queue entry, and stop reason is recorded through
  the findings CLI.
- General, discovery, and cold review agents record one batched changed-file
  coverage attestation when they can identify the files they substantively
  assessed. Current content identities determine whether an attestation still
  counts; coverage prioritizes later review work but never replaces either
  whole-target clean gate.
- Every finding passes the current `review-findings schema`. Every accepted
  runtime finding has a recorded production path, reachability evidence,
  likelihood, impact, actual consequence, contract evidence, root cause,
  recommended repair, and intervention justification; the CLI derived severity
  and `accept` from the risk rating.
- Every actionable maintenance finding records root cause and intervention
  justification in addition to current-cost evidence. Patches, deferrals, and
  approved consultations also record the recommended repair.
- Every autonomous fix names a current reachable contract and remains
  proportional to its impact.
- `scope-start` persisted or inherited the branch's original baseline, every
  accepted fix was followed by `scope-check`, and the final check passed before
  `scope-complete`. Repeated runs did not compound the allowance. Any authorized
  reset records the user's words through `scope-authorize`.
- Final validation for the affected flows passed, or blockers and residual
  risk are explicit.
- No remote branch or PR mutation occurred while either review phase still had
  findings. After both phases were clean, the final full local validation
  passed before the reviewed result was pushed.
- The PR-capable target has reviewer-checkable proof from `pr-proof-pack`, or
  the PR/proof blocker is reported separately from the review result.
- The final answer is backed by `review-findings closeout`, not chat memory.
- The final answer identifies the exact reviewed commit.

## Stop honestly

Stop without claiming clean when tools or the selected native engine are
unavailable, validation is blocked, budgets expire, the user stops the run,
subagents are unavailable and the user has not accepted lower confidence, or
the consult queue still has open entries.

There is no "clean except" final verdict. The result is clean only after the
consult queue is resolved.

## Avoid

- switching or overriding the review model without user approval;
- invoking `ask-codex` or `ask-claude` without the current user's explicit
  request;
- substituting self-review, ad hoc prompts, or one-off subagents for the two
  configured phases;
- patching follow-up or out-of-scope findings into this PR;
- leaking prior findings or desired conclusions into cold reviewers;
- editing between clean passes in either phase;
- returning from Phase 2 to Phase 1 after cold-review fixes unless explicitly
  requested;
- reviewing or completing a dirty checkout;
- pushing just to review;
- pushing between findings, review phases, or targeted validation runs;
- writing final closeout sections from chat history;
- leaving external native-review tasks or sessions unarchived after collecting
  their output;
- treating file coverage as a clean verdict or telling a cold reviewer that
  lower-priority files were previously approved.
