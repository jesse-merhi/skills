# Worktree isolation

Use a dedicated git worktree when the receiving full session may edit files,
repair code, create commits, or publish a PR. Give simultaneous handoff
sessions distinct worktree paths and branches.

Use the current checkout only for explicitly read-only discovery, monitoring,
summarization, or when the user asks the new session to share it. Source notes,
specs, and artifacts may remain read-only context while implementation occurs
in the dedicated worktree.

Use the repository's configured branch prefix. If none exists, use
`handoff/<task-name>`.

Report the exact worktree path and branch. Never treat a queued worktree setup
identifier as proof that the session started.
