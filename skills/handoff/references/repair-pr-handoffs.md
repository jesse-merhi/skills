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
- make it choose the PR delivery shape before implementation: one PR for one
  cohesive review unit, one bottom-to-top stack for two or more dependent
  review units, and separate PRs or stacks for independent work
- for a dependent multi-PR story, tell it to load `gh-stack`, name the logical
  layers in dependency order, and keep all work for that stack inside its
  dedicated task worktree
- tell it to create a branch and draft PR, or submit the planned draft stack,
  when the repair is complete unless the user explicitly requested local-only
  work
- tell it to run `pr-proof-pack` for each draft PR after it exists, then apply
  the PR review gate from `AGENTS.md` bottom-to-top; when `code-review` is
  missing or stale, ask whether to run it or proceed without it instead of
  starting the expensive review automatically
- tell it to resolve in-scope review findings, rerun affected validation, and
  refresh `pr-proof-pack` after any review fixes before calling the PR ready
- tell it to keep the PR draft/not-ready when proof-pack, review, validation,
  model, tooling, budget, or consult blockers remain
- tell it to summarize the `code-review` findings and fixes, or the explicit
  waiver, before asking for and verifying a `jesse-merhi` thumbs-up (`+1`)
  reaction on every ready PR; require it never to create or remove that
  reaction on the user's behalf
- require the final report to explain the original bug, root cause, changed
  files, verification commands, proof artifacts, the ordered PR/stack map with
  every URL and status, `code-review` results, and any residual risk or
  follow-up

Do not let a repair handoff end with only "fixed it" or a terse file list. The
handoff should make the next agent produce enough context for the user to decide
whether the PR is worth reviewing without replaying the whole session.
