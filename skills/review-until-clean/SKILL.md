---
name: review-until-clean
description: 'Run the harness-native review (bare `codex review` in Codex, the built-in code-review workflow in Claude Code) in a fix-and-rerun loop until clean; also used as code-review''s first phase.'
---

# Review Until Clean

Run the harness's own built-in review in a loop. Every time the review
surfaces actionable findings, fix only those findings and run the review
again. Stop only after the engine's required clean streak: **three
consecutive clean runs** for the codex engine, **one clean run** for the
claude engine. The claude streak is shorter because one workflow run is
already an internal panel (independent finders plus a verifier per
candidate) and costs hundreds of thousands of subagent tokens; the user can
ask for a longer streak on risky changes.

This skill is separate from `cold-pr-review-until-clean`: the source of truth
is the harness's native review mode, not a custom prompt, `cold-pr-review`, a
repo-specific review command, or an ad hoc subagent.

Do not use this skill for a one-off read-only review. A plain `codex review`,
`/review`, or `/code-review`-style request should run once and report findings
without editing unless the user explicitly asks for the until-clean loop or
`code-review` has selected this as its native review phase.

## Engine Selection

Pick the review engine before the first iteration:

1. If the user names an engine (codex or claude), use that engine.
2. Otherwise use the engine that matches the running harness:
   - Codex CLI -> the codex engine (bare `codex review`).
   - Claude Code -> the claude engine (built-in `code-review` workflow).
3. Cross-harness requests need a fallback:
   - Claude engine requested from Codex: the built-in workflow only exists
     inside Claude Code. Use the helper's structured Claude reviewer
     (`scripts/codex-review --structured --engine claude`) and tell the user
     the bare built-in reviewer was unreachable from this harness.
   - Codex engine requested from Claude Code: run the codex engine normally;
     the helper shells out to the `codex` CLI either way.

Use one engine for the whole loop. Never switch engines mid-streak: a clean
streak only means something when the same reviewer saw the same tree every
time.

## Non-Negotiables

```yaml
review_tool: must invoke the selected engine's bare built-in review; do not substitute a self-review or ad hoc subagent
prompt_policy: pass only the review target plus tracked-finding notices generated per review-guardrails; no other prompt, checklist, desired verdict, or rationale
fix_tool: apply targeted fixes directly, or use the repo-specific fix workflow when one exists
stop_condition: required_clean consecutive runs with zero actionable findings (codex: 3, claude: 1)
counter_reset: any actionable finding resets consecutive_clean to 0
no_early_exit: do not stop before the engine's required clean streak
no_self_review: do not decide the tree is clean without a fresh engine run
same_tree_for_streak: do not edit, stage, unstage, commit, or otherwise change the reviewed tree between clean passes
same_engine_for_streak: do not switch review engines between passes
consult_findings: consult-worthy findings go to the consult queue; keep fixing other findings instead of waiting
queue_matched_passes: a pass whose only findings match the open consult queue counts toward the streak but can never produce a final clean verdict
fixed_point: when the streak is met and the consult queue is non-empty, suspend as blocked-on-consult; never keep re-running the engine on an unchanged tree
```

## Pre-Flight

Before the first review:

1. Confirm the target: uncommitted local diff, base branch, or commit SHA.
2. Check engine availability:
   - codex engine: `codex review --help` in the current environment. CLI
     flags may vary by Codex version.
   - claude engine: confirm the Workflow tool is available in this session.
3. Check the working tree and note local changes that may affect fixes.
4. Load `review-guardrails`. When running as `code-review`'s Phase 1, the
   orchestrator's budgets, consult queue, and queue-matching rules
   apply; standalone, set them up directly from that skill. A budget stop is
   an honest stop, not a failure. There is no iteration cap: the budgets are
   the bound.
5. Identify required verification commands, but do not feed CI status,
   implementation rationale, or review checklists into the review.

If the repo is dirty, make sure fixes will land in the intended checkout. For
local CLI work, use the user's normal isolation rules before editing unless they
explicitly asked to stay in the current checkout.

## Codex Engine

Invoke `codex review` with the target flag only. Do not append a prompt.

Use these forms:

```sh
# Review staged, unstaged, and untracked local changes.
codex review --uncommitted

# Review branch changes against a base branch such as main.
codex review --base main

# Review one commit.
codex review --commit <sha>
```

For GitHub PRs, check out the PR branch locally first, then use
`codex review --base <base-branch>`. `codex review` does not take a PR number in
the tested CLI surface.

Prefer `--base <branch>` or `--uncommitted` for review-until-clean loops where
you expect to edit fixes. A commit SHA is immutable: after fixing findings from
`codex review --commit <sha>`, do **not** keep reviewing the old SHA. Either
amend/create the fix commit and retarget the command to the new SHA, or switch
the loop target to `codex review --base <branch>` or `codex review --uncommitted`
so Codex reviews the fixed tree.

Do not use these forms:

```sh
codex review --uncommitted "custom instructions"
codex review --base main "custom instructions"
codex review - <<'PROMPT'
...
PROMPT
```

Treat stdout from `codex review` as the review artifact. In the tested Codex CLI
version, target modes have no `--json` flag and reject custom prompts; attempts
to request JSON still returned human review text. If a future Codex version
adds a native JSON flag, use it only when it does not require a custom prompt
and does not change the review instructions.

Do not treat stderr model-refresh warnings or startup noise as findings. A
non-zero exit code, missing stdout verdict, interrupted run, or wrong-target run
is not clean.

## Claude Engine

Inside Claude Code, invoke the built-in reviewer through its named workflow.
This is the same finder-and-verify review that `/code-review` runs, and the
workflow namespace cannot be shadowed by a personal skill of the same name:

```text
Workflow({ name: "code-review", args: "<level> [target]" })
```

- Levels: `high`, `xhigh`, or `max` only; default to `high`. The workflow
  has no low/medium level. Any first token that is not one of these three is
  treated as part of the target and the level silently falls back to `high`,
  so always spell the level out.
- Everything after the level is the review target only:
  - omit the target to review the current branch diff plus uncommitted
    changes (the whole-target default);
  - `<base>...HEAD` (for example `main...HEAD`) for branch-vs-base review;
  - a commit SHA for one commit;
  - a PR number for a checked-out PR.
- Pass only the target, plus tracked-finding notices for open Class B
  findings, generated fresh per `review-guardrails`. The workflow accepts
  free-form instructions in the target string, but nothing else goes in: no
  checklists, other prior findings, implementation rationale, or desired
  verdicts.
- The workflow runs in the background and its verified findings arrive as a
  task notification. Wait for that notification; do not edit the tree or
  start the next iteration while a review is in flight.
- Each run fans out finder and verifier subagents (a `high` run measured
  roughly 24 agents, 800k subagent tokens, and 9 minutes). Because each run
  is already an internal panel, `required_clean` is 1 for this engine. Say
  what a run costs before starting if the user has not already accepted an
  until-clean loop.
- Findings come back with `CONFIRMED` or `PLAUSIBLE` verdicts and are
  recall-biased at higher levels, so triage with `finding-discipline` before
  fixing.
- Do not run this engine through a nested `claude -p "/code-review ..."`
  call: slash-command names resolve personal skills first, so a personal
  `code-review` skill shadows the built-in reviewer there.

A workflow that errors, is interrupted, or returns no verdict is not clean.

## Classifying a Run

Classify every run from the engine's review output after triage:

- `clean`: no findings, or only findings rejected with recorded evidence.
  For codex, the output clearly says the reviewed change is correct or has
  no findings. For claude, the workflow report has an empty findings list.
- `clean-except-queue`: every remaining finding matches an open
  consult-queue entry (`review-guardrails`). Counts toward the streak;
  cannot produce the final clean verdict.
- `has_findings`: at least one actionable finding remains.
- `ambiguous`: errored, interrupted, wrong target, no clear verdict, or output
  could not be interpreted.

When in doubt, treat the run as `has_findings` or `ambiguous`. Extra cycles are
cheaper than falsely declaring convergence.

## The Loop

Maintain these across the whole session:

```text
consecutive_clean = 0
iterations = 0
required_clean = 3 for the codex engine, 1 for the claude engine
```

Repeat:

```text
1. If the wall-clock budget has expired:
     STOP and report unresolved state honestly.
2. iterations += 1
3. Run the selected engine's bare review against the fixed target.
4. Triage the findings:
   - reject only with recorded evidence
   - uncertain findings -> provisional-fix test (review-guardrails):
       pass -> fix now, log Provisional, ask the user without waiting
       fail -> consult queue (Class B), ask the user without waiting
   - findings matching an open queue entry -> match note, no new entry
   If open questions for the user have reached consult_cap ->
     SUSPEND as blocked-on-consult: present all open questions and wait.
5. Classify the run (see Classifying a Run):
   clean / clean-except-queue / has_findings / ambiguous
6. If clean or clean-except-queue:
     consecutive_clean += 1
     If clean-except-queue and the engine cannot send tracked-finding
     notices (codex) -> SUSPEND as blocked-on-consult now; without
     notices, repeat passes on a tree with a known finding are degraded.
     If consecutive_clean >= required_clean:
       If the consult queue is empty -> STOP, report success.
       Else -> SUSPEND as blocked-on-consult: present the queue and wait
               for the user. Do not re-run the engine on this unchanged
               tree.
     Else -> go to step 1 without changing the reviewed tree.
7. If has_findings:
     consecutive_clean = 0
     Fix the actionable findings with narrow edits.
     If the target was an immutable commit SHA, update the reviewed
     target to the amended/new commit SHA, or switch to the
     base/uncommitted target before the next review. Do not re-review an
     old immutable commit after fixes.
     Run relevant verification for the fixes.
     Inspect the diff so the fix maps to the findings, then check the
     diff-growth budget.
     Go to step 1.
8. If ambiguous:
     consecutive_clean = 0
     Re-run once if the failure looks transient.
     If ambiguity persists, STOP and report unresolved state honestly.
```

Resume after the user answers a suspended loop:

- Any accepted finding -> fix it, close its queue entry, reset
  `consecutive_clean` to 0, and go to step 1 on the changed tree.
- All open entries rejected -> record the decisions; the completed streak
  already covered this exact tree, so STOP and report success citing those
  rejections.

Between consecutive clean reviews, **do not edit code**. A multi-run streak
is only meaningful if the engine reviews the same tree every time.

## Fixing Findings

- Fix only what maps to actionable review findings.
- Prefer the smallest change that addresses the review concern.
- Do not bundle unrelated cleanup into the fix step.
- Run the relevant tests, typechecks, linters, or UI validation for the changed
  surface before the next review.
- Inspect the diff after fixing so you can confirm the next review sees the
  intended tree.
- If a finding is invalid, document why and run another review. Do not count
  your rejection as a clean pass by itself.

## Reporting

Narrate one short line per iteration:

```text
iter 1: codex review --uncommitted -> 2 findings -> fixed
iter 2: codex review --uncommitted -> clean (1/3)
iter 3: codex review --uncommitted -> clean (2/3)
iter 4: codex review --uncommitted -> 1 finding -> counter reset
iter 5: codex review --uncommitted -> clean (1/3)
iter 6: codex review --uncommitted -> clean (2/3)
iter 7: codex review --uncommitted -> clean (3/3)
```

The claude engine narrates the same way with its own streak target:

```text
iter 1: code-review workflow high main...HEAD -> 1 finding -> fixed
iter 2: code-review workflow high main...HEAD -> clean (1/1)
```

On termination, report:

- Final iteration count
- Engine used and why (harness default or user override)
- Stop reason: `clean-streak-met`, `blocked-on-consult`, `budget-expired`,
  or `ambiguous-review`
- Target command or workflow args used
- Last review summary and verdict
- Findings fixed directly
- Findings intentionally rejected as invalid, with rationale
- Consult-queue findings awaiting the user, with their registry entries
- Verification commands and results

## Hard Rules

- Always run the selected engine's bare review for each iteration.
- Never pass custom review prompts or output-format prompts to the engine.
- Never claim success before the engine's required clean streak.
- Never edit between clean passes.
- Always reset the counter on any actionable finding or ambiguous review.
- Do not replace the engine's review with `spawn_agent`, `cold-pr-review`,
  a repo-specific review command, or manual judgement.
- Respect the wall-clock and diff-growth budgets from `review-guardrails`.
- Route consult-worthy findings through the consult queue; keep fixing
  other findings instead of waiting, and do not silently fix or reject
  them.
- Never re-run the engine on an unchanged tree beyond the streak
  requirement; suspend as blocked-on-consult instead.
- Never report a fully clean verdict while the consult queue has open
  entries.
- A machine-local override may change budget values for one machine; it
  does not remove the budgets.
