---
name: acpx-frontend-delegation
description: Delegate substantial Codex frontend work to Claude Code through acpx. Use when running in Codex and the task includes visual design direction, dense CSS/layout work, responsive UI polish, ambiguous frontend implementation, or the user explicitly asks to use Claude/acpx for frontend work.
---

# ACP Frontend Delegation

Use Claude Code through `acpx` as a frontend specialist while Codex keeps ownership of scope, files, validation, and the final answer.

## Workflow

1. Read enough local context first:
   - changed UI files, nearby components, styles, tokens, and docs
   - relevant frontend skills such as `impeccable` and `frontend-ui-validation`
2. For unclear design direction, ask Claude for a read-only plan:

```sh
npx acpx@0.11.0 --model opus --cwd "$PWD" --approve-reads --timeout 1800 \
  claude -s frontend "Inspect the changed UI and propose the smallest polished fix. Do not edit yet."
```

3. Decide the scope in Codex. Keep the instruction narrow and name the exact file(s) Claude may change.
4. For implementation, use a fresh one-shot Claude process:

```sh
npx acpx@0.11.0 --model opus --cwd "$PWD" --approve-all --timeout 1800 \
  claude exec "Implement the agreed frontend change. Keep scope narrow and run the relevant checks."
```

5. Review Claude's diff yourself:
   - protect user changes
   - reject unrelated edits
   - check for design anti-patterns
   - send concrete findings back through a fresh `claude exec` when Claude should fix its own work
6. Validate with the normal frontend proof:
   - run app or static server
   - run `frontend-ui-validation`
   - run Impeccable detection
   - check mobile, tablet, and desktop widths
   - verify console errors and horizontal overflow

## Important Behavior

Use the named `frontend` session only for read-only planning and design direction.

Use fresh `claude exec` for writes. Large write prompts in a resumed Opus planning session can sit in thought without tool calls, while fresh `exec` writes promptly.

If `acpx`, `claude`, auth, or Opus access fails, continue in Codex and report that delegation was skipped.

## Command Notes

- Keep `--model opus` for frontend work.
- Use `--approve-reads` for planning.
- Use `--approve-all` only for scoped implementation prompts in a clean worktree or otherwise safe edit context.
- Use `--timeout 1800` for real frontend implementation. Avoid cancelling early unless status or logs show the agent is blocked.
- Prefer a fresh worktree when the current checkout is dirty.
