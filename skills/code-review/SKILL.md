---
name: code-review
description: 'Review a PR, branch, commit, or diff with a two-phase until-clean workflow: map changed flows, run native review, run cold review, fix findings, and verify.'
---

# Code Review

This skill means one thing: orchestrate two until-clean review phases. First
run `review-until-clean` until it is clean. Then run
`cold-pr-review-until-clean` in a subagent until it is clean. Use
`finding-discipline` throughout both phases to triage findings before fixing.
Each phase must satisfy its own clean stop condition on the same final target
before the review can close.

Phase 1 uses the harness-native review engine: bare `codex review` in Codex,
the built-in `code-review` workflow in Claude Code. If the user names an
engine, that engine wins. `review-until-clean` owns the engine-selection and
fallback rules.

Keep separate unless explicitly requested: repo-specific review bots, security
remediation workflows, OpenGrep, merge, and advisory writing.

## Model Gate

`gpt-5.5` is the standard Codex review model. Treat any other Codex review
model as a deliberate user-approved exception, not as a helper default.

Claude review uses the Claude Code `default` alias with `max` effort. The
current expected Claude Code default model behind this policy is Opus 4.8
(`opus[1m]`). Treat a different default model, or a Fable/Mythos-family model
appearing in the Claude Code catalog, as a stop-and-update event.

Before the first review phase in every `code-review` run, run:

```sh
scripts/check-review-models
```

The gate checks native model catalogs:

- `codex debug models` must still report `gpt-5.5` as the top visible Codex
  model.
- Claude Code's Agent SDK initialization catalog must still report `default`
  as Opus 4.8 with `max` effort support.
- Claude Code's Agent SDK initialization catalog must not list a Fable or
  Mythos-family model as available.

The Claude check installs `@anthropic-ai/claude-agent-sdk` into a local cache on
first use, then reads `initializationResult().models` from Claude Code without
sending a prompt or running a paid completion.

For manual inventory checks, run:

```sh
scripts/check-review-models --check-api-inventory
```

That optional API path uses `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` when they
are present. It can show a new model exists in the authenticated account, but
it does not say which model Codex or Claude Code recommends for review work.
The default Phase 1 gate stays on the Codex CLI and Claude Code SDK catalogs.

If official guidance names a newer or better recommended Codex model than
`gpt-5.5`, if the Codex catalog ranks another visible model above `gpt-5.5`, if
Claude Code's catalog changes the default away from Opus 4.8, or if Claude Code
lists a Fable/Mythos-family model as available, stop the entire review process
before Phase 1. Tell the user the model named by the catalog, the source checked,
and that `code-review` / `scripts/codex-review` need an update. Do not run
native review, cold review, subagents, tests, or fix loops until the user approves how
to proceed.

If the freshness check cannot be completed, stop before Phase 1 and tell the user
the check failed. This check is required to avoid silently reviewing with stale
model assumptions.

## Loop

Maintain:

```text
iteration = 0
last_reviewed_head = <current HEAD or PR head SHA>
last_reviewed_target = <base + HEAD + dirty-tree/snapshot identity>
repo_display_name = <readable repo name, such as example-app>
decision_log_path = <Obsidian note or local fallback file>
review_started = <local timestamp>
baseline_diff = <changed files and changed lines of the original target>
scope_baseline = <request, target, intended behavior, owner boundary, files>
consult_queue = []
findings_ledger = []
```

Repeat:

1. Run the one-time setup, including the model gate.
2. Phase 1: load `review-until-clean` and run it until the native review is
   clean on the current target. Use `finding-discipline` throughout to accept,
   reject, or scope findings before fixing. Record every triage decision in
   the decision log.
3. After every Phase 1 fix, run affected validation and reset both phase clean
   confirmation state to zero.
4. Phase 2: run `cold-pr-review-until-clean` in a subagent until cold review is
   clean on the same target. Give it the one-time setup summary and risk
   checklist.
5. Use `finding-discipline` throughout Phase 2 to accept, reject, or scope
   findings before fixing. Record every triage decision in the decision log.
6. After every Phase 2 fix, run affected validation and return to Phase 1,
   because the target changed. Reset both phase clean confirmation state to
   zero.
7. Run final validation, publish or update the PR when the target is
   PR-capable, run `pr-proof-pack`, and complete any end-of-process checks.
8. Stop clean only when Phase 1 and Phase 2 each satisfy their own clean stop
   condition on the same final target after the last accepted fix and affected
   validation has passed.

Stop honestly on unavailable tools, validation blockers, user stop, or
budget expiry. Findings that need human, product, or security judgment go to
the consult queue per `review-guardrails`; the loop keeps fixing other
findings, and once only queue items remain it suspends as
`blocked-on-consult` and brings the queue to the user.

## Scope Governor

Before Phase 1, freeze the review scope:

- original request, issue, or PR purpose
- base and target branch
- intended behavior
- owner boundary
- changed files
- non-test changed lines

Before patching a reviewer finding, classify it:

- `In-scope blocker`: introduced or exposed by this diff, inside the same
  owner boundary, and fixable without changing the task contract.
- `Follow-up`: real issue, but adjacent or broader than this PR.
- `Stop-and-consult`: requires a new shared contract, migration, API shape,
  storage shape, product/security judgment, or different owner boundary.

Patch only in-scope blockers. Record follow-ups in the decision log and do
not patch them in this PR. Put stop-and-consult findings in the consult queue
with the scope reason.

## Budgets and Consult Gates

`review-guardrails` owns the bounds for this skill: the wall-clock budget
(default 8 hours per run), the diff-growth budget (about 30% of baseline
lines), the consult queue for findings that need user input, and the
queue-matching and fixed-point rules that stop later review passes from
re-litigating queued findings. There is no iteration cap: the budgets are
the bound.

Orchestrator specifics:

- Record `review_started` and `baseline_diff` in both the loop state and the
  decision log header.
- Provisional fixes (Class A) are decision-log entries with status
  `Provisional`; the user's keep-or-revert answer updates the entry to Adopted
  or Rejected.
- Keep the consult queue in the decision log: each entry carries its
  fingerprint (file, code element, root cause), and review passes that
  re-raise it get a one-line match note instead of a new entry.
- Generate tracked-finding notices for cold reviewers and the claude
  workflow from the currently open consult entries at every dispatch, per
  `review-guardrails`. Never reuse a previous pass's notice text.
- When open questions for the user reach `consult_cap` (default 5, counting
  open Class B entries plus unanswered provisional fixes), suspend the
  whole review as blocked-on-consult and present them in one batch before
  running more cycles.
- When a phase suspends as `blocked-on-consult`, bring the queue to the user:
  ask directly in an interactive session, otherwise end with the questions
  in the report. Resume the phase when answers arrive — accepted findings
  get fixed and reset the phase, rejections are recorded and let the
  suspended streak close.
- The overall review cannot close while the queue has open entries. There
  is no "clean except" verdict: the result is clean only after the queue is
  resolved, otherwise it is blocked-on-consult.

## Findings Ledger and Final Report

Maintain a run-level `findings_ledger` for every finding raised by native
review, cold review, required lenses, conditional lenses, structured reviewers,
or the user. The decision log remains the source of truth; the ledger is the
closeout index that makes the full review understandable after the final clean
passes.

For every finding, track:

- decision ID
- origin: native review, cold review, named lens, structured reviewer, or user
- severity or priority when available
- scope class when available: direct, induced, adjacent, or unrelated
- status: adopted, rejected, scoped, deferred, provisional, reopened, or
  blocked-on-consult
- affected files or behavior
- short reason and validation result

At closeout, summarize the whole ledger, not just the last clean run. Include
counts by origin and status, call out adopted fixes with their validation, list
scoped or deferred follow-ups, and list rejected findings only when the
evidence is useful for reviewers or the user. If the final clean confirmations
reported no remaining findings, say that as "the final pass had no remaining
findings" after the ledger summary. Do not write a final report that only says
`No findings` unless no reviewer, lens, or user-raised finding appeared
anywhere in the whole run.

## One-Time Setup

Do once before review loops, then redo only if the target, base, or dirty local
overlay changes:

1. Run `scripts/check-review-models`. Stop the whole review before Phase 1 if
   a newer or better recommended Codex model than `gpt-5.5` is available, if a
   Claude Code default model changed, if a Fable/Mythos-family Claude model
   is available, or if the check cannot be completed.
2. Map changed flows, entrypoints, contracts, side effects, state transitions,
   risk surfaces, and validation targets with `review-surface-map`.
3. Load `review-guardrails`; record `review_started`, `baseline_diff`, and
   `scope_baseline` in the loop state and decision log header.
4. Run the required review lenses before the first review phase:
   - `pr-rubbish-audit`: classify every changed file and flag unrelated churn,
     dangerous removals, generated drift, stale branch-history comments,
     accidental deletions, or unneeded refactors.
   - `improve-codebase-architecture`: check boundaries, ownership, dependency
     direction, public contracts, abstractions, testability, and whether any
     structural issue should be fixed in this PR.
   - `reducing-cognitive-load`: check for hidden protocols, duplicated or weak
     types, stringly typed data, dense branching, shallow helpers, and code that
     makes future maintainers reverse-engineer the domain shape.
   - `typescript-discipline`: evaluate whether the diff has TypeScript
     production code, API/client contracts, schemas, exported functions, typed
     React code, or type-system escape hatches. If none, record
     `not applicable`. If present, unsafe boundary types, duplicated domain
     types, unjustified assertions, weak runtime narrowing, and contract drift
     are actionable findings and should be fixed at the narrowest useful
     boundary.
5. Add conditional review lenses only when their trigger is present:
   - `test-audit`: mandatory when the PR touches code with nearby or related
     tests, or when the PR changes, adds, or deletes tests. Check both whether
     related tests should change and whether changed tests earn their keep,
     especially around removed APIs, impossible states, implementation details,
     or branch-local history.
   - `frontend-ui-validation`: mandatory when the diff changes visible UI,
     layout, styling, routes/screens, interaction states, loading/error/empty
     states, responsive behavior, or screenshots would materially prove the
     change. This lens must include Impeccable detection on the changed UI
     path or running URL.
6. Build a neutral risk checklist for `cold-pr-review-until-clean` from the
   changed-surface map and required/conditional lenses. Include checklist
   topics, not prior findings, desired conclusions, implementation rationale,
   or earlier review results.
6. Create the decision log:
   - Resolve `repo_display_name` from the repository name in the git remote or
     toplevel directory. Keep the human-readable name and casing, such as
     `example-app`; do not use context keys like `github.com__owner__repo`
     in Obsidian-facing paths.
   - Prefer the user's real Obsidian vault when it is discoverable. Use a
     neutral local-only note path such as:

     ```text
     ~/Documents/Obsidian/Reviews/Decision Logs/<repo-display-name>/<target-slug>-<YYYYMMDD-HHMMSS>.md
     ```

   - If no real Obsidian vault is available, create a local fallback file
     outside the product repo:

     ```text
     ~/.local/state/agent-review-decision-logs/<repo-display-name>/<target-slug>-<YYYYMMDD-HHMMSS>.md
     ```

   - Record the absolute path in `decision_log_path` and keep appending to the
     same file for the whole review run.
   - Do not write the decision log into the product repo, PR body, PR comment,
     commit message, or issue unless the user explicitly asks.
7. Note validation commands needed for affected surfaces: package scripts for
   tests, typecheck, lint, build, UI/E2E, migrations, security, or generated
   artifacts.
8. Propose durable context updates only when the diff changes long-lived
   project facts and the update is evidence-backed.

## Decision Log

The decision log is the decision registry for the main agent and user to
inspect locally after a long review. It should explain why findings were
adopted, rejected, scoped, or reopened without polluting the PR or the reviewed
repository.

Write decision entries for a reader who has not seen the codebase, the PR, or
the review output. Use plain language, name the concrete code or behavior, and
explain project terms the first time they matter. Good: "The route checks the
current user before loading the record." Bad: "Authorization is handled
upstream." If a term is necessary, add a short example in the same sentence.

Start the file with:

```md
# Review Decision Log

- Target: <PR, branch, commit, or git range>
- Base: <base branch or sha, when relevant>
- Started: <local timestamp>
- Baseline diff: <changed files and changed lines of the original target>
- Main agent: <harness/model when known>
- Decision log path: <absolute path>
```

Append one entry for every review finding, lens finding, user-requested change,
and meaningful reopen decision. Use this template exactly, with these headings
in this order. Do not rename, skip, or merge sections:

```md
## D<N>: <Adopted | Rejected | Scoped | Deferred | Provisional | Reopened>: <short title>

#### Target Head
<sha or local tree description>

#### Decision
<what the agent decided to do, written in one or two plain sentences>

#### Reason
<why this decision was made, including any tradeoff or scope boundary>

#### Evidence
<files, commands, docs, reviewer output summary, or invariant that proves the
decision>

#### Implementation
<how the decision was implemented: files changed, behavior changed, no-op,
follow-up, or blocker>

#### Validation
<what was checked, why it was checked, observed result, and why that result
supports the decision>
```

Rules:

- Update the entry after the implementation or validation result changes.
- Keep entries in decision order. Do not add a per-entry timestamp unless the
  timing itself affects the decision.
- Put the decision status in the title. Put the actual choice in `Decision`. If
  the origin of the decision matters, include it in `Evidence`.
- Link related decisions by ID when a later review reopens an earlier
  rejection or narrows an earlier broad finding.
- Keep entries concrete. A rejected finding needs evidence, such as an upstream
  guard, a test, a type contract, product scope, or a dependency guarantee.
- The `Implementation` section must say exactly how the decision was carried
  out. For a no-op, explain why no code changed. For a fix, name the changed
  file or function and the behavior that changed.
- Do not use `Validation` as a generic list of commands. Explain the check and
  the result in terms of the specific decision.
- Do not include secrets, auth URLs, raw session logs, hidden prompts, browser
  session data, or unnecessary tool output.
- Do not feed the decision log to the native review engine.
- Pass the decision-log path to cold reviewers so they can append their own
  decisions after their review verdict is complete.
- Do not pass decision-log contents or prior decisions to cold reviewers before
  their verdict. In cold-review prompts, include this guard: "Do not open or
  read the review decision log before giving your verdict. After your verdict is
  complete, append your own adopted, rejected, scoped, deferred, or reopened
  decisions to the log. If you cannot write to the log, return those entries to
  the main agent."
- Cold-review entries must use the exact decision-log template from this skill.

### Decision Entry Examples

Use these as shape examples, not as reusable wording. Keep real entries tied to
the actual code and evidence in the review.

```md
## D1: Adopted: Pending refunds were not treated as active refunds

#### Target Head
abc1234

#### Decision
Fix the duplicate-refund guard so it blocks both pending and completed refunds.

#### Reason
The review found that two fast refund requests could both create a refund while
the first refund was still pending. A pending refund is already active work, so
the second request should stop.

#### Evidence
`src/refunds.ts` only checked `status === "succeeded"`. The refund provider can
return `pending` before it later returns `succeeded`.

#### Implementation
Changed `src/refunds.ts` so the duplicate check treats `pending` and
`succeeded` as active refund states. Added a test that sends a second request
after a pending refund exists.

#### Validation
`pnpm test refunds` passed. The new test proves the second request now reuses
the existing pending refund instead of creating another one.
```

```md
## D2: Rejected: Admin route can expose another tenant's invoice

#### Target Head
abc1234

#### Decision
Do not change this route for the reported tenant leak.

#### Reason
The route only receives invoice IDs after the tenant filter has already run in
the parent loader. "Tenant" means the customer workspace that owns the invoice.

#### Evidence
`src/routes/admin.ts` calls `loadTenantInvoiceIds(user.tenantId)` before this
handler runs. `src/routes/admin.test.ts` has a cross-tenant invoice test that
expects a 404.

#### Implementation
No code change. The existing parent loader and test already cover the reported
case.

#### Validation
`pnpm test admin` passed, including the cross-tenant invoice test. That proves
an invoice from a different tenant is still hidden from this route.
```

## Validation

Run the commands identified during setup after each fix and after both review
phases are clean. Prefer package scripts for tests, typecheck, lint, build,
UI/E2E, migrations, security, or generated-artifact checks. If required
validation cannot run, stop honestly with the blocker or residual risk.

## Review Phase Rules

- Default to whole PR/branch review. If the branch has committed PR changes and
  dirty local changes, review a temporary snapshot that includes both the
  branch diff and the dirty local overlay. A clean local-only review only proves
  there is no local patch; it does not prove the PR/branch is clean.
- Treat a whole-target snapshot as review input, not the working copy. If
  review finds a real bug from snapshot content, apply the accepted fix in the
  real checkout, run affected validation there, then rerun review. The next
  whole-target review must rebuild a fresh snapshot from the real checkout. Do
  not leave accepted fixes only inside the temporary worktree; the helper
  removes that worktree after review.
- Use local mode only when the requested target is the local patch by itself.
  Use branch mode only when the requested target is the committed branch by
  itself.
- If the review helper is quiet, wait. Long reviews may print heartbeat lines
  such as `review still running: ... elapsed=... pid=...`; treat those as
  progress.
- Do not kill a quiet review just because it has been silent for a few
  minutes. Inspect only after missed heartbeats, an obviously failed
  subprocess, or a review that has run past the expected long-review window.
- If tests and review run in parallel and either causes edits, rerun affected
  tests and rerun both review phases on the changed target.
- Review panels are opt-in. Use extra reviewers only when requested or when
  risk justifies the cost.
- Prefer read-only tools and web search during review when dependency behavior
  matters.
- If an accepted finding shows a repeated bug class, inspect sibling instances
  in the current review scope before fixing. Fix the scoped pattern at once
  when practical, but stop at touched surfaces, owner boundaries, or clear
  follow-up territory.
- When structured review output is available, classify each finding as:
  `direct`, `induced`, `adjacent`, or `unrelated`. Direct findings point at
  changed files. Induced findings point at unchanged code that the change now
  exposes or calls. Adjacent findings are real nearby issues outside this PR's
  required fix. Unrelated findings are old issues that the change does not
  cause, expose, or worsen. Direct and induced findings block review; adjacent
  and unrelated findings are recorded but do not block unless the user explicitly
  expands scope.
- Do not rerun review only to get nicer wording. The second clean confirmation
  exists to reduce missed findings, not to polish the final report.
- Do not push just to review. Push only when the user requested publish, ship,
  PR update, another GitHub mutation, or the `PR Closeout` step below is
  running after both review phases and final validation are clean.

## Subagents

Always use subagents for code-review work. At minimum, every review needs a
subagent using `cold-pr-review-until-clean`; do not use `cold-pr-review` for
this skill. Give that subagent the target, base, changed-surface summary, and
the risk checklist from the one-time setup.

Always add a focused `test-audit` subagent when the PR touches code with nearby
or related tests, or when the PR changes, adds, or deletes tests. Ask it to
check both coverage drift and changed-test usefulness.

Always add a focused `typescript-discipline` subagent when the changed surface
includes TypeScript production code, shared domain types, schemas,
API/client/server contracts, exported helpers, typed React components, or
assertions/`any`/`unknown` boundary handling.

Add other focused subagents with the relevant named skills when useful:
`pr-rubbish-audit`,
`improve-codebase-architecture`,
`reducing-cognitive-load`,
`frontend-ui-validation`,
`impeccable`,
or `monitoring-gh-actions`.

Give subagents neutral prompts: target, base, changed-surface summary, and the
checklist they own. Tracked-finding notices for open Class B findings,
generated fresh per `review-guardrails`, are the one allowed reference to
prior findings. Do not leak desired conclusions or ask for a rubber stamp.
Give cold-review subagents the decision-log path, but tell them not to open or
read it before giving their verdict. After the verdict, they should append
their own decisions to the log or return the entries if they cannot write.
If the harness cannot run subagents, say so, continue only as best effort, and
do not call the review clean unless the user accepts that limitation.

Run `monitoring-gh-actions` at the end, after both review phases and local
validation are clean, when PR checks are pending and monitoring is in scope.

## Evidence

When creating, updating, or preparing a PR, include proof that the behavior
works in the PR description, PR comment, or closeout.

Prefer visual proof for UI work: desktop and mobile screenshots for each
meaningfully changed viewport, state, or flow, plus Impeccable detector output
for the changed UI target. If screenshots are impossible or irrelevant, provide
programmatic proof: focused test results, Playwright/Maestro traces, API
responses, migration dry runs, script output, logs, CI links, or command
summaries. Tie each evidence item to the behavior or risk it proves.

## PR Closeout

After both review phases are clean on the same final target and final local
validation has passed, ensure the reviewed branch has PR evidence:

1. Check whether a PR already exists for the branch, such as with
   `gh pr view --json url,number,state,headRefName,baseRefName`.
2. If no PR exists and the target is a PR-capable branch, create one. Prefer a
   draft PR unless the user requested a ready PR. If the branch is not pushed,
   push it first. Preserve unrelated local changes and do not include files
   outside the accepted review scope.
3. Before creating or updating the PR body, load `pr-proof-pack` and follow it
   exactly: run its net-diff script, choose the smallest useful proof, validate
   Mermaid if used, and include verification results tied to the reviewed
   behavior.
4. After any branch change made for PR creation or proof, rerun
   `pr-proof-pack`'s refresh checklist before updating the PR.

If the target is a local-only patch, detached commit, non-GitHub repo,
uncommitted default-branch worktree, or another target where PR creation would
be unsafe or impossible, do not pretend the PR step succeeded. Report the
review result separately from the PR blocker and say what is needed to create
the PR.

## Closeout Rules

- Verify accepted native-review findings by reading the real code path.
- Read dependency docs/source/types when findings depend on external behavior.
- Reject speculative edge cases, broad rewrites, and fixes that over-complicate
  the codebase.
- Prefer small fixes at the right ownership boundary.
- Never switch or override the review model. Retry transient capacity failures
  with the same command/model.
- Push only when the user requested publish, ship, or PR update.
- If tests, validation, `review-until-clean`, or
  `cold-pr-review-until-clean` cause edits, rerun affected validation and return
  to Phase 1 before declaring clean.
- Do not downgrade either phase's clean stop condition because the first pass
  looks obviously clean.

## Helper

Use `scripts/codex-review` from this skill whenever the codex engine runs:
always in Codex, and in Claude Code only when the user forces the codex
engine. When Phase 1 uses the claude engine, the built-in `code-review`
workflow reviews the branch diff and the dirty local overlay directly, so no
snapshot helper is needed; the snapshot rules below apply to the codex engine.
For normal PR/branch work, leave the helper in `--mode auto`. Auto means whole target:
clean feature branches review the branch against the base; dirty feature
branches review a temporary snapshot containing both committed branch changes
and local staged, unstaged, and untracked files. Force `--mode local` only for
dirty-only review. Force `--mode branch` only for committed-only review. The
helper must keep the Codex phase as bare `codex review`: do not add custom
prompts, datasets, checklists, or desired verdicts to Codex review.

```sh
scripts/codex-review
scripts/codex-review --mode whole
scripts/codex-review --mode branch
scripts/codex-review --parallel-tests "<focused test command>"
scripts/codex-review --mode uncommitted
scripts/codex-review --dry-run
scripts/codex-review --output /tmp/codex-review.out
```

The helper:

- selects whole PR/branch review in `--mode auto`: a clean feature branch uses
  native `codex review --base <base>`, while a dirty feature branch uses a
  temporary worktree snapshot with local staged, unstaged, and untracked files
  committed only inside the snapshot;
- treats that snapshot as disposable review input. Accepted fixes must be
  applied back in the real checkout, then reviewed again through a newly built
  target or snapshot;
- falls back to local review for dirty default-branch checkouts;
- supports `--mode whole` to force the whole-target behavior;
- supports `--mode branch` for committed-only branch review and `--mode local`
  for dirty-only review;
- accepts `--mode uncommitted` as an alias for local review;
- resolves bare `git`, `gh`, and `codex` commands from absolute `PATH` entries
  outside the reviewed checkout, so a repo-local executable cannot shadow them;
- runs `git fetch origin --quiet` before branch or whole-target review,
  warning and continuing with existing refs if fetch fails;
- uses `gpt-5.5` as the standard Codex review model and pins
  `model_reasoning_effort="high"` by default; use `--thinking codex=xhigh`
  only for tricky/high-risk changes where the extra latency is worth it;
- runs `scripts/check-review-models` before real review work. Dry runs skip
  the gate because they do not start Phase 1;
- supports `--parallel-tests`, `--parallel-tests-shell`, `--heartbeat-seconds`,
  `--output`, and `--dry-run`;
- supports optional structured JSON review with `--structured`, `--json-output`,
  `--prompt`, `--prompt-file`, `--dataset`, `--stream-engine-output`,
  `--panel`, `--reviewers`, `--model`, and `--thinking`;
- keeps structured review separate from native Phase 1. Do not pass custom
  prompts, datasets, or JSON-schema instructions to native `codex review`.
  Use structured mode only as an explicit extra reviewer path, calibration path,
  or machine-readable ledger path.
- defaults structured Codex reviewers to `gpt-5.5` with `high` thinking;
- defaults structured Claude reviewers to `default` with `max` effort;
- writes a normalized JSON ledger when `--json-output` is set. Prefer placing
  that file beside the review decision log or in another local-only review
  state path, not in the product repo unless the user asks.
- classifies structured findings by scope instead of dropping out-of-diff
  findings blindly. `direct` and `induced` findings are blocking; `adjacent`
  and `unrelated` findings are retained as nonblocking context.
- prints `review still running: codex elapsed=<seconds>s pid=<pid>` while a
  review is active but quiet;
- exits nonzero on `[P0]` through `[P3]` findings, empty review output, failed
  review commands, or failed parallel tests.

Smoke-test the helper without spending a real review call:

```sh
skills/code-review/scripts/test-codex-review-helper
```

Check model guidance directly:

```sh
skills/code-review/scripts/check-review-models
```

Calibrate the optional structured reviewer when changing its prompt/schema or
when reviewer quality is in doubt:

```sh
skills/code-review/scripts/calibrate-structured-review --fixture both
skills/code-review/scripts/calibrate-structured-review --fixture malicious --thinking xhigh
```

This creates a temporary fake repo. The malicious fixture contains intentionally
bad code with shell command injection and password exposure; the reviewer must
report both kinds of findings. The benign fixture contains safe shell/filesystem
and owner-check code; the reviewer should stay clean. This calibration is not
part of normal `$code-review` and should not run unless the agent or user
explicitly wants to test reviewer quality.

## Output

Report iterations, the Phase 1 engine used, `review-until-clean` result,
`cold-pr-review-until-clean` result, validation results, the findings ledger
breakdown, PR URL or PR blocker, `pr-proof-pack` result, PR evidence, context
updates, required-lens results, structured JSON ledger path when one was
written, decision-log path, budget use (elapsed wall clock and diff growth
against the baseline), the consult queue awaiting the user, final verdict, and
anything left for human judgment. When clean, say plainly that both phases were
clean on the same final target, including the same dirty-tree/snapshot identity
when local overlay changes were present, that the required review lenses were
completed, and name real test gaps or residual risk. If the last review pass
had no findings, phrase that as the final clean confirmation, not as the whole
review outcome unless the findings ledger is empty.
