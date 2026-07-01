# Commands

## Read-Only Planning

For unclear design direction, ask Claude for a read-only plan:

```sh
npx acpx@0.11.0 --model opus --cwd "$PWD" --approve-reads --timeout 1800 \
  claude -s frontend "Inspect the changed UI and propose the smallest polished fix. Do not edit yet."
```

## Scoped Implementation

For implementation, use a fresh one-shot Claude process:

```sh
npx acpx@0.11.0 --model opus --cwd "$PWD" --approve-all --timeout 1800 \
  claude exec "Implement the agreed frontend change. Keep scope narrow and run the relevant checks."
```

## Command Notes

- Keep `--model opus` for frontend work.
- Use `--approve-reads` for planning.
- Use `--approve-all` only for scoped implementation prompts in a clean worktree
  or otherwise safe edit context.
- Use `--timeout 1800` for real frontend implementation.
- Avoid cancelling early unless status or logs show the agent is blocked.

Large write prompts in a resumed Opus planning session can sit in thought
without tool calls, while fresh `exec` writes promptly.
