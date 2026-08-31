# Codex engine

Invoke the native `codex review` engine without a custom prompt. When this skill
runs standalone, use the bare forms below. When `code-review` delegates Phase 1,
use its required `scripts/codex-review` transport instead; that helper invokes
native review from an untouched frozen-base checkout and must not be replaced by
a bare target-checkout command.

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
the tested CLI. This target-checkout instruction applies only to standalone
`review-until-clean`, never to a `code-review` phase that requires the frozen
helper.

For delegated `code-review` Phase 1, use equivalent helper forms:

```sh
scripts/codex-review --mode whole --base <base-branch>
scripts/codex-review --mode branch --base <base-branch>
scripts/codex-review --mode uncommitted
scripts/codex-review --mode commit --commit <sha>
```

The helper resolves the requested target, creates a synthetic commit, and
invokes native `codex review --commit` from the untouched frozen base. Do not
append a prompt or invoke bare `codex review` from the target checkout.

For standalone loops, prefer `--base <branch>` or `--uncommitted` where you
expect to edit fixes. A commit SHA is immutable. After fixing findings from
`codex review --commit <sha>`, do **not** keep reviewing the old SHA. Either
amend/create the fix commit and retarget the command to the new SHA, or switch
the loop target to `codex review --base <branch>` or
`codex review --uncommitted` so Codex reviews the fixed tree.

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
to request JSON still returned human review text. If a future Codex version adds
a native JSON flag, use it only when it does not require a custom prompt and
does not change the review instructions.

Do not treat stderr model-refresh warnings or startup noise as findings. A
non-zero exit code, missing stdout verdict, interrupted run, or wrong-target run
is not clean.

Run the command through the `wait-efficiently` Codex shell-wait pattern. Resume
a yielded cell instead of polling from separate model turns or restarting a
quiet review.

## Session lifecycle

Run native Codex review outside the coordinator session, never as an in-chat
subagent. If the dispatch mechanism creates a saved Codex task or session,
record its ID immediately. Once the review output has been captured, archive
that exact task in guaranteed cleanup, including when the review fails, is
cancelled, becomes stale, or the loop stops early. Use `set_thread_archived` in
Codex Desktop or `codex archive <id>` for a standalone session. Archival is part
of completing each invocation; perform it before dispatching the next native
review.

The `code-review` helper archives the rollout sessions created by its own native
`codex review` command. That does not cover a separate task created through ACP
or an app-level task API; the coordinator still owns cleanup of that external
task.
