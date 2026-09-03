# Floyd handoff: skill profiles

Captured on 2026-09-04 from committed checkpoint `f154a49`, plus the exact
two-file working diff that was present in the Floyd worktree. This branch keeps
that state separate from the existing PR branch.

## Goal and current design

PR [#126](https://github.com/jesse-merhi/skills/pull/126) adds a generated
Codex `cold-reviewer` agent profile and a role-scoped skill catalog for both a
spawned cold reviewer and native `codex review`. The profile is read-only,
keeps the approved review skills, and disables unrelated skills by exact path.

The remote PR remains a draft at `c475683`; its CI was green at that older head.
Local work continued with:

- `c21ec6b`: reuse the trusted executable boundary for Git and cover nested
  repository skill roots;
- merge `f154a49`: bring in current `main`, including PRs #124 and #125;
- the working diff now preserved here: normalize trusted and extra repository
  paths to real absolute paths, cover a relative `--repo` argument, update the
  trusted-path expectations, and remove a test that asserted a Markdown
  heading from the profile prose.

## Test audit of the working diff

- **Keep:** the relative `--repo` CLI case. It owns the regression where Codex
  receives a relative opt-out path and therefore leaves an unrelated skill
  enabled.
- **Keep:** the real-path expectations for trusted repositories. They prove the
  same path contract at the catalog boundary.
- **Delete:** the profile-heading assertion. A Markdown heading is instruction
  presentation, not reviewer behavior, and the repository explicitly rejects
  deterministic tests of skill prose.
- **Missing:** none identified for this two-file fix.

## Review and validation state

Phase 1 native review reached its confirmation pass and found the relative-path
bug plus the prose assertion. Both fixes are present on this handoff branch.
After merging current `main`, the persisted review budget incorrectly counted
the upstream merge as 2,379 lines of PR growth. The actual PR diff against that
main was still about 1,724 lines. A request to re-freeze the review baseline was
dismissed without a replacement decision, so the review remains stopped and
Phase 2 has not run on this state.

Handoff verification on this branch passed the three focused Vitest files (29
tests), the complete `bun run validate:effect` chain (16 files, 165 tests), and
the separate `skills-test` harness (12 tests). Run the full validation again
after any branch reconciliation.

## Recommended continuation

1. Compare this branch with the current PR #126 remote head. It is a safe
   handoff checkpoint; do not assume the draft PR already contains it.
2. Re-freeze the review baseline against the current `main` while keeping the
   existing PR scope, or deliberately choose another reconciliation strategy.
3. Restart Phase 1 on the resulting exact head, then run the fresh cold-review
   phase and final validation.
4. Keep PR #126 as a draft until those gates finish. Regenerate any proof
   artifacts rather than depending on temporary files from the old machine.

No transcript, local path, credential, or temporary artifact is needed to
continue.
