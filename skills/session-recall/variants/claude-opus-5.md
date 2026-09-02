---
name: session-recall
description: Find prior local Codex or Claude sessions; keep contents local and inspect cards before opening logs.
---

# Session recall

Recover the most relevant prior full session while keeping logs local and
minimizing transcript load. Open with the bounded query in one short line.
Update only when the search must broaden to another source, date range, or
worker history.

Return the smallest useful set of session cards or the selected session context,
with enough provenance for the user to choose or continue. Save no new artifact
and never paste full logs into the response. Inspect cards before opening logs
and stop when the requested prior work is identified; do not add a generic
second search. Run recall in the current session without delegation.

Use `agent-session-find` as the first recall step when previous agent work may
answer the current question. The goal is to recover the right full session with
minimal tokens, not to dump transcripts into context.

Keep session contents local. Do not upload session contents or paste whole
session logs into external tools.

## Workflow

1. Confirm the command setup in [command-setup.md](references/command-setup.md).
2. Start with a recent, bounded fuzzy query:
   `agent-session-find --index-since 14d --max-sources 80 "<query>"`.
3. Add repo or cwd context when the project is known:
   `agent-session-find --cwd "<repo-name>" --since 30d "<query>"`.
4. Search one source when the likely harness is known:
   `agent-session-find --source codex "<query>"` or
   `agent-session-find --source claude "<query>"`.
5. If the user mentions a handoff, worker, subagent, delegated implementation,
   reviewer pass, branch, commit, or PR opened by another agent, retry with
   `--workers`.
6. If nothing matches, widen gradually: increase `--index-since`, remove
   `--cwd`, try synonyms, then omit `--max-sources` for a fuller local refresh.
7. If running several follow-up searches against the same index, add
   `--no-refresh` after the first successful refresh.
8. Use [query-strategy.md](references/query-strategy.md) for search terms.
9. Inspect low-token result cards first, then use
   [result-handling.md](references/result-handling.md) before opening logs.

## Defaults

Use these defaults unless the task suggests otherwise:

```sh
agent-session-find --index-since 14d --max-sources 80 "<query>"
agent-session-find --cwd "<repo-name>" --since 30d "<query>"
agent-session-find --limit 5 "<query>"
```

For stale or long-running projects, prefer `--index-since 90d` over an
unbounded first pass. Run `agent-session-find status` when you need to see index
size before widening.

## Context pointers

- Use [command-setup.md](references/command-setup.md) for binary, wrapper,
  privacy, database, and parallel-refresh rules.
- Use [query-strategy.md](references/query-strategy.md) for query terms and
  widening strategy.
- Use [result-handling.md](references/result-handling.md) for interpreting
  result cards and deciding when to open local JSONL.
