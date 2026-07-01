---
name: acpx-frontend-delegation
description: Delegate substantial Codex frontend work to Claude Code through acpx. Use when running in Codex and the task includes visual design direction, dense CSS/layout work, responsive UI polish, ambiguous frontend implementation, or the user explicitly asks to use Claude/acpx for frontend work.
---

# ACP Frontend Delegation

Use Claude Code through `acpx` as a frontend specialist while Codex keeps
ownership of scope, files, validation, and the final answer.

## Workflow

1. Read enough local UI context first: changed files, nearby components, styles,
   tokens, docs, and relevant skills such as `impeccable` and
   `frontend-ui-validation`.
2. If design direction is unclear, ask Claude for a read-only plan using
   [commands.md](references/commands.md).
3. Decide the implementation scope in Codex. Name the exact file(s) Claude may
   change.
4. For writes, use a fresh one-shot Claude process with the scoped command in
   [commands.md](references/commands.md).
5. Review Claude's diff yourself using [review.md](references/review.md).
6. Validate with the normal frontend proof before reporting done.

## Required Behavior

- Use the named `frontend` session only for read-only planning and design
  direction.
- Use fresh `claude exec` for writes.
- If `acpx`, `claude`, auth, or Opus access fails, continue in Codex and report
  that delegation was skipped.
- Prefer a fresh worktree when the current checkout is dirty.

## Context Pointers

- Use [commands.md](references/commands.md) for planning, implementation, and
  command-option details.
- Use [review.md](references/review.md) for diff review, validation, and fallback
  handling.
