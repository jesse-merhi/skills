---
name: wait-efficiently
description: 'Manage CI monitoring, prolonged commands, timed delays, and pending agents with bounded waits.'
---

# Wait efficiently

Start a task, and estimate how long that task should take. Then, use a wait command to hold the same operation until completion, required attention, or its deadline.

- If waiting for Commands or agents: follow the steps for the current host, [Codex](references/codex.md) or [Claude Code](references/claude.md).
- If waiting for CI in GH: use one installed `gh` watch command; [GitHub Actions](references/github-actions.md) gives the commands.
- If you need to wait for anything else use explicit delays such as any harness supplied `sleep` tool or `quiet-wait 5m`.

When you are done waiting, check if the task is done. If not, then provide a better estimate and wait again.
