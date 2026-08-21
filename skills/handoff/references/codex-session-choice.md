# Codex session choice

Use a **brand-new Codex session/thread** when the next work is:

- a standalone feature, aside, follow-up, or exploratory task
- a parallel line of work, subtask, bug bash, monitor run, or background worker
- work that should be scoped by the handoff document rather than inherited chat
  history
- likely to run autonomously, create evidence, watch another thread, or report
  status later
- using the current repo or worktree only because files are present there,
  including uncommitted changes

For a brand-new Codex repair/edit/PR session, prefer a dedicated Codex-managed
worktree over the same checkout. In Codex app contexts, create or move the new
thread into a Codex worktree before implementation begins when the app exposes
that capability. If the current task must reference uncommitted discovery
artifacts, put those paths in the handoff and seed prompt; do not make the
repair agent write in the discovery worktree just because the artifacts live
there.

When launching a brand-new Codex app thread into a dedicated worktree, use the
worktree environment without a branch `startingState` by default:

```text
target: {
  type: "project",
  projectId: "<project id>",
  environment: { type: "worktree" }
}
```

Put the desired worker branch name in the handoff and seed prompt, and tell the
worker to create or switch to that branch after the worktree is available. Do
not pass `startingState: { type: "branch", branchName: "..." }` for a new
branch; that field means "start from this existing branch" and will fail setup
when the branch does not already exist. Only use branch `startingState` after
verifying the exact local or remote branch already exists.

Do not treat a returned `pendingWorktreeId` as proof that the worker is running.
It only proves that worktree setup was queued. Before reporting a handoff as
launched, verify that a real thread appears, the worker worktree exists, or the
app reports successful setup. If verification is unavailable, report it as
queued/pending, not started.

Use a **Codex fork** only when the next agent genuinely needs the raw current
conversation history itself, such as continuing an interrupted debugging or
review turn where the exact prior back-and-forth is part of the state.

Do not fork merely because the current worktree has uncommitted changes. For
that case, create a brand-new thread and put the exact repo/worktree path in the
handoff and initial prompt, telling the new agent to `cd` there before commands.
If a clean project thread cannot see the required files, explain that tradeoff
and ask before committing, stashing, copying, or otherwise changing repo state.

Before using a fork, write down the reason in your working notes and final
report. If the reason is only "same directory", "current files", "parallel
worker", "background session", or "convenience", use a brand-new session
instead.

For brand-new sessions outside tmux, seed the session with only a concise
message that:

- links to the handoff document
- states the next session's focus
- tells the new agent to read the handoff before acting
- names the exact repo/worktree path if it must use a non-default checkout
- says whether the session should work in a dedicated worktree; repair/edit/PR
  and parallel worker handoffs should do so by default
- gives the worker's intended branch name and tells it to create/switch to that
  branch after the Codex-managed worktree starts
- says not to rely on inherited history
- says not to create, fork, rename, pin, archive, or monitor other Codex threads
  unless thread orchestration is explicitly the delegated task

For forks, still link the handoff document so the next agent has the compact
summary, and make the fork prompt narrowly override any irrelevant inherited
history. Report created sessions using the current Codex app requirements.
