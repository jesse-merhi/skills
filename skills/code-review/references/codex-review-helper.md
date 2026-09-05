# Codex review helper

Use `scripts/codex-review` whenever Phase 1 uses Codex. It is a thin Effect CLI
over native `codex review`; it does not duplicate the reviewer, invent a second
verdict protocol, or parse prose to decide whether a review is clean.

The helper pins `model` and `review_model` to `gpt-6-astra`, and
`model_reasoning_effort` to `medium`, using CLI configuration overrides. This
applies with or without the installed findings-only profile and does not alter
the parent or global configuration. Inspect the native invocation evidence; a
prompt requesting medium cannot override inherited launcher settings. For an
explicit alternate reviewer, use the native command with that user's settings
and the same clean-target/lifecycle gates rather than this pinned helper.

```sh
scripts/codex-review
scripts/codex-review --mode branch --base origin/main
scripts/codex-review --mode commit --commit HEAD
scripts/codex-review --parallel-tests "bun run test"
scripts/codex-review --output /tmp/codex-review.out
scripts/codex-review --dry-run
```

The helper requires a clean committed worktree, resolves a concrete Git target,
delegates review to the native command, prints its output unchanged, and
propagates process or parallel-test failures. It stops before review when staged,
unstaged, or untracked changes exist.

A clean checkout uses `--base`. Without it, the helper discovers the current
PR base, then `origin/HEAD`, `origin/main`, `origin/master`, `main`, or `master`
in that order.

Before starting review, the helper resolves `codex` outside the reviewed
checkout and verifies the standalone CLI for the current runtime identity. It
treats `codex login status` as an informational cache hint, checks the redacted
`auth.credentials` result from `codex doctor --json` when that command is
available, and makes a tiny ephemeral live provider request from an empty
temporary directory. Doctor warnings and older CLIs without that diagnostic
continue to the isolated live check; a hard credential error stops early. The
helper separates locally confirmed credential failures from ambiguous live
failures, whose safe remediation covers rejected or expired credentials,
network, rate-limit, model, and configuration problems. It does not echo
diagnostic details that may contain local paths or service endpoints.

OpenClaw must reuse the host's authenticated Codex CLI and auth file instead of
creating an unrelated embedded-provider login. With the shared auth file in
place, switching accounts through `cxa` also switches the account used by
OpenClaw's standalone `codex` command.

The helper records the resolved base and committed head before and after each
review. If either changes while the reviewer is running, it discards that stale
answer, resolves the latest target, and reruns. It stops with an error after
three continuously changing runs instead of claiming that an unstable target
was reviewed.

Run the helper through the `wait-efficiently` Codex shell-wait pattern. Resume a
yielded cell instead of rerunning the helper.

`--parallel-tests` runs the review and test command in one structured Effect
scope. If either fails, the sibling is interrupted instead of being orphaned.
`--output` or `CODEX_REVIEW_OUTPUT` persists the current invocation only after
the reviewer succeeds, creating parent directories as needed so stale output
cannot masquerade as a new result.

The review workflow triages findings and determines the clean stop condition.
This transport helper does not. Accept ordinary clean summaries; never require
one magic phrase such as `No findings.`.
