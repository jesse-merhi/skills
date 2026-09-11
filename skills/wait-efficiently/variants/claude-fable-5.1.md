---
name: wait-efficiently
description: 'Manage CI monitoring, prolonged commands, timed delays, and pending agents with bounded waits.'
---

# Wait efficiently

Start once and estimate the operation’s remaining duration. Choose a wait long enough for that estimate, bounded by the host’s actual limits and any required communication deadline. When no update is required sooner, wait silently until completion, required attention or that deadline. Set enclosing waits deliberately too; each underlying tool keeps its own separate limit. Early completion should return immediately.

- If waiting for Commands or agents: follow the steps for the current host, [Codex](references/codex.md) or [Claude Code](references/claude.md).
- If waiting for CI in GH: use one installed `gh` watch command; [GitHub Actions](references/github-actions.md) gives the commands.
- If you need to wait for anything else use explicit delays such as any harness supplied `sleep` tool or `quiet-wait 5m`.

If the deadline expires with the operation still running, revise the remaining-time estimate and resume the existing handle. Give any required update without restarting the operation or rereading logs, code and instructions just to fill the update. Inspect logs when completion, failure, an unexpected stall or a concrete decision requires them.
