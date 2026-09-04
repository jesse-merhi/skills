---
name: session-recall
description: Find prior local Codex or Claude sessions; keep contents local and inspect cards before opening logs.
---

# Session recall

Recover the relevant prior full session with minimal transcript exposure.
Use `agent-session-find` first when prior agent work may answer the question.
Keep contents local; never upload them or paste whole logs into external tools.

Read [command-setup.md](references/command-setup.md) for setup, privacy, database,
and refresh rules. Start bounded:

```sh
agent-session-find --index-since 14d --max-sources 80 "<query>"
agent-session-find --cwd "<repo-name>" --since 30d "<query>"
agent-session-find --limit 5 "<query>"
```

Choose repo/cwd context when known and `--source codex` or `--source claude` when
the likely harness is known. For handoffs, workers, subagents, delegated work,
reviewer passes, or another agent's branch, commit, or PR, retry with `--workers`.

If unmatched, widen in steps: increase `--index-since`, remove `--cwd`, try synonyms,
then omit `--max-sources` for a fuller local refresh. For stale or long-running
projects start with `--index-since 90d` rather than an unbounded scan. Use
`agent-session-find status` to inspect index size before widening when needed.
After the first successful refresh, use `--no-refresh` for follow-up queries
against the same index.

Use [query-strategy.md](references/query-strategy.md) for terms. Inspect compact
result cards before logs and follow [result-handling.md](references/result-handling.md)
before opening local JSONL. Return the relevant session and supported answer,
not a transcript dump.
