# Floyd session handoff — 2026-09-04

This is a sanitized handoff of the recent Floyd sessions that belong to the
public `jesse-merhi/skills` repository. It contains conclusions and Git
checkpoints, not transcripts. Local paths, temporary artifacts, account data,
credentials, and work from non-public repositories are deliberately excluded.

## Resume map

| Session | Handoff branch | Captured checkpoint | State |
| --- | --- | --- | --- |
| Remove redundant tests and define test ownership | `jesse/floyd-coding-standards-handoff-2026-09-04` | `3ece639` | Active two-PR coding-standards stack; local review fixes preserved, review unfinished |
| Implement skill profiles for cold-reviewer and native Codex review | `jesse/floyd-skill-profiles-handoff-2026-09-04` | `f154a49` plus the two-file working diff described on that branch | Draft PR work preserved; exact-head review unfinished |
| Apply the reference-layout rule to the Skills repo | `main` | squash merge `0ffa5c5` | Complete; PR #125 merged |

Fetch the repository, then inspect the `FLOYD_HANDOFF.md` on either active
handoff branch before changing code. These handoff branches intentionally do
not replace or force-update the existing PR branches.

## Completed session: reference layout and test ownership

PR [#125](https://github.com/jesse-merhi/skills/pull/125) merged into `main` as
`0ffa5c5`. It keeps skill references one hop from `SKILL.md`, adds the skill
layout lint to `validate:effect`, and applies the owner's rule that linters are
proved by running them against the real tree rather than by synthetic linter
tests.

The final validation and CI were green. The accepted coverage trade-off is
important: running a linter on the tree catches false positives, but it cannot
prove that a rule has silently stopped firing. Follow-ups recorded in the
session were the remaining fan-out warnings, whether the lint should eventually
use a Markdown parser, and simplifying the multi-reference
`speak-fking-english` skill.

The old local reference-layout worktree is historical. Continue from current
`main`, not its deleted remote feature branch.

## Security boundary

One additional Floyd session belongs to a non-public repository. Its code and
details are intentionally absent here and have a separate handoff inside that
repository.
