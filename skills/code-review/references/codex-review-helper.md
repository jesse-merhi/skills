# Codex Review Helper

Use `scripts/codex-review` whenever Phase 1 uses Codex. It is a thin Effect CLI
over native `codex review`; it does not duplicate the reviewer, invent a second
verdict protocol, or parse prose to decide whether a review is clean.

```sh
scripts/codex-review
scripts/codex-review --mode branch --base origin/main
scripts/codex-review --mode uncommitted
scripts/codex-review --mode commit --commit HEAD
scripts/codex-review --parallel-tests "pnpm test"
scripts/codex-review --output /tmp/codex-review.out
scripts/codex-review --dry-run
```

The helper resolves a concrete Git target, delegates review to the native
command, prints its output unchanged, and propagates process or parallel-test
failures. In auto mode a dirty branch runs both the branch review and an
uncommitted-overlay review, so committed and local changes are both covered.
A clean checkout uses `--base`, defaulting to `origin/main`. Pass the actual PR
base explicitly when it differs.

The helper records the branch, tracked diff, and hashes of untracked files
before and after each review. If the target changes while the reviewer is
running, it discards that stale answer, resolves the latest target, and reruns.
It stops with an error after three continuously changing runs instead of
claiming that an unstable target was reviewed.

`--parallel-tests` runs the review and test command in one structured Effect
scope. If either fails, the sibling is interrupted instead of being orphaned.
`--output` persists the current invocation only after the reviewer succeeds,
so stale output cannot masquerade as a new result.

The review workflow—not this transport helper—triages findings and determines
the clean stop condition. Accept ordinary clean summaries; never require one
magic phrase such as `No findings.`.
