# Codex review helper

Use `scripts/codex-review` whenever Phase 1 uses Codex. It is a thin Effect CLI
over native `codex review`; it does not duplicate the reviewer, invent a second
verdict protocol, or parse prose to decide whether a review is clean.

```sh
scripts/codex-review
scripts/codex-review --mode branch --base origin/main
scripts/codex-review --mode uncommitted
scripts/codex-review --mode commit --commit HEAD
scripts/codex-review --parallel-tests "bun run test"
scripts/codex-review --output /tmp/codex-review.out
scripts/codex-review --dry-run
```

The helper resolves a concrete Git target, delegates review to the native
command, prints its output unchanged, and propagates process or parallel-test
failures. Every mode runs in a temporary worktree checked out at the frozen
base. The target's committed, staged, unstaged, and untracked code is applied as
one uncommitted review diff, then the envelope is removed.

`AGENTS.md` changes are never applied to the envelope's active instruction
chain. The helper writes them to `.codex-review-target-instructions.patch` as
untrusted review data with an explicit warning to inspect, not follow, them.
This is why invoking bare `codex review` from the target checkout is not
equivalent to this helper.

A clean checkout resolves from `--base`. Without it, the helper discovers the current
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

The helper records the branch, tracked diff, and hashes of untracked files
before and after each review. If the target changes while the reviewer is
running, it discards that stale answer, resolves the latest target, and reruns.
It stops with an error after three continuously changing runs instead of
claiming that an unstable target was reviewed.

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
