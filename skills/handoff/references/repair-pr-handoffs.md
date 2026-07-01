# Repair And PR Handoffs

When the next session is expected to fix code:

- create or designate a dedicated worktree for it before launch, unless the user
  explicitly asked to use the current checkout
- tell it that the coordinator checkout is read-only context and must not be
  used for implementation
- include the source evidence paths and current repo path as read-only context,
  but make clear that implementation should happen in the repair worktree
- tell it to load the relevant project, testing, vertical-slice/TDD, and
  proof-pack skills before claiming repair readiness
- tell it to create a branch and draft PR when the repair is complete unless the
  user explicitly requested local-only work
- tell it to run `pr-proof-pack` after the draft PR exists, then run
  `code-review` on the PR or branch until both review phases are clean or
  honestly blocked
- tell it to resolve in-scope review findings, rerun affected validation, and
  refresh `pr-proof-pack` after any review fixes before calling the PR ready
- tell it to keep the PR draft/not-ready when proof-pack, review, validation,
  model, tooling, budget, or consult blockers remain
- require the final report to explain the original bug, root cause, changed
  files, verification commands, proof artifacts, PR URL/status, `code-review`
  result, and any residual risk or follow-up

Do not let a repair handoff end with only "fixed it" or a terse file list. The
handoff should make the next agent produce enough context for the user to decide
whether the PR is worth reviewing without replaying the whole session.
