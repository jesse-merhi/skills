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
failures. Every mode runs in a temporary worktree checked out at the branch's
frozen merge base, the reviewed commit's parent, or an empty base for a root
commit or unborn repository. The target's committed, staged, unstaged, and
untracked code is applied as one uncommitted review diff, then the envelope is
removed.

Case-insensitive variants of `AGENTS.md` and `AGENTS.override.md`, the `.agents`
instruction root including `.agents/skills/**`, `.codex/config.toml`, and target `.gitattributes` changes
are never applied to the envelope's active control surface. The helper writes
them to `.codex-review-target-control.patch` as untrusted review data with an
explicit warning to inspect, not follow, them, and force-adds that artifact so a
target `.gitignore` cannot hide it from review. It marks the temporary project
untrusted and disables configured fallback instruction filenames for the
native session, so target-controlled skills, project configuration, or fallback
files cannot become active. This is why invoking bare `codex review` from the
target checkout is not equivalent to this helper.

Repository paths reached through complete frozen-base instruction symlink
chains are frozen as part of the same control surface, using the exact symlink
blob without trimming path whitespace. Absolute or
repository-escaping control symlinks fail closed because the temporary worktree
cannot safely redirect them to frozen content. Missing targets and targets
inside unmaterialized gitlinks also fail closed, as does a target file or gitlink
that blocks an active frozen symlink destination. Case-folded aliases and target
symlinks that could redirect an ancestor of a protected destination are
quarantined. Target-side control changes are captured as forced text independent
of target attributes. If a target file replaces a base directory containing an
ordinary scoped instruction file, the replacement remains in the review target;
the now-inapplicable nested instruction is represented only as a control deletion.

Tracked target state is materialized through Git's index and tree operations,
not a textual patch. Gitlinks, file modes, deletions, and case-normalizing
renames therefore remain part of the uncommitted review target. Snapshot
materialization ignores sparse-checkout skip bits, then overlays only actual
working-tree changes, so out-of-cone tracked context remains available. A
tracked path changed into a directory is rebuilt from its individually filtered
untracked children rather than recursively copied. Tracked symlink changes are
copied as symlinks before any target-following filesystem checks. Dynamic Git
paths use literal pathspecs, and every working-tree source parent must resolve
inside the repository, so filenames and ancestor symlinks cannot alter snapshot
commands or import host files. Target-controlled symlinks that point outside the
repository fail closed in committed, staged, unstaged, and untracked state.
Commit mode reads parent metadata only from the commit header and rejects an
unavailable shallow parent instead of misclassifying the target as a root
commit; fetch or deepen that history before retrying.

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
