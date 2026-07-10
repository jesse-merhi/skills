# Codex Review Helper

Use `scripts/codex-review` from this skill whenever the codex engine runs:
always in Codex, and in Claude Code only when the user forces the codex engine.
When Phase 1 uses the claude engine, the built-in `code-review` workflow reviews
the branch diff and the dirty local overlay directly, so no snapshot helper is
needed; the snapshot rules below apply to the codex engine.

For normal PR/branch work, leave the helper in `--mode auto`. Auto means whole
target: clean feature branches review the branch against the base; dirty feature
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
- runs `git fetch origin --quiet` before branch or whole-target review, warning
  and continuing with existing refs if fetch fails;
- uses `gpt-5.6-sol` as the standard Codex review model and pins
  `model_reasoning_effort="xhigh"` by default;
- runs `<skill-dir>/scripts/check-review-models` before real review work. Dry
  runs skip the gate because they do not start Phase 1;
- supports `--parallel-tests`, `--parallel-tests-shell`, `--heartbeat-seconds`,
  `--output`, and `--dry-run`;
- supports optional structured JSON review with `--structured`, `--json-output`,
  `--prompt`, `--prompt-file`, `--dataset`, `--stream-engine-output`,
  `--panel`, `--reviewers`, `--model`, and `--thinking`;
- keeps structured review separate from native Phase 1. Do not pass custom
  prompts, datasets, or JSON-schema instructions to native `codex review`. Use
  structured mode only as an explicit extra reviewer path, calibration path, or
  machine-readable ledger path.
- defaults structured Codex reviewers to `gpt-5.6-sol` with `xhigh` thinking;
- defaults structured Claude reviewers to `claude-fable-5[1m]` with `high`
  effort;
- writes a normalized JSON ledger when `--json-output` is set. Prefer placing
  that file beside the local findings database state or the optional decision
  log, not in the product repo unless the user asks.
- classifies structured findings by scope instead of dropping out-of-diff
  findings blindly. `direct` and `induced` findings are blocking; `adjacent` and
  `unrelated` findings are retained as nonblocking context.
- prints `review still running: codex elapsed=<seconds>s pid=<pid>` while a
  review is active but quiet;
- exits nonzero on `[P0]` through `[P3]` findings, empty review output, failed
  review commands, or failed parallel tests.

Smoke-test the helper without spending a real review call:

```sh
<skill-dir>/scripts/test-codex-review-helper
```

Check model guidance directly:

```sh
<skill-dir>/scripts/check-review-models
```

Calibrate the optional structured reviewer when changing its prompt/schema or
when reviewer quality is in doubt:

```sh
<skill-dir>/scripts/calibrate-structured-review --fixture both
<skill-dir>/scripts/calibrate-structured-review --fixture malicious --thinking xhigh
```

This creates a temporary fake repo. The malicious fixture contains intentionally
bad code with shell command injection and password exposure; the reviewer must
report both kinds of findings. The benign fixture contains safe shell/filesystem
and owner-check code; the reviewer should stay clean. This calibration is not
part of normal `$code-review` and should not run unless the agent or the user
explicitly wants to test reviewer quality.
