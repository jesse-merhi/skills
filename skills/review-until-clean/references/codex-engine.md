# Codex engine

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
the tested CLI.

Prefer `--base <branch>` or `--uncommitted` for review-until-clean loops where
you expect to edit fixes. A commit SHA is immutable: after fixing findings from
`codex review --commit <sha>`, do **not** keep reviewing the old SHA. Either
amend/create the fix commit and retarget the command to the new SHA, or switch
the loop target to `codex review --base <branch>` or `codex review
--uncommitted` so Codex reviews the fixed tree.

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
