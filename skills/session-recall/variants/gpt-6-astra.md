---
name: session-recall
description: Find prior local Codex or Claude sessions; keep contents local and inspect cards before opening logs.
---

# Session recall

Use local evidence to recover the prior session that answers the user's question.
Choose terms from their clues and metadata instead of asking them to repeat
information already available. Keep session contents local and never upload or
paste whole logs into external tools.

## Find candidates before reading transcripts

Read [command-setup.md](references/command-setup.md), then use
`agent-session-find` as the first recall step. Default to:

```sh
agent-session-find --index-since 14d --max-sources 80 "<query>"
agent-session-find --cwd "<repo-name>" --since 30d "<query>"
agent-session-find --limit 5 "<query>"
```

Apply known repo/cwd context and `--source codex` or `--source claude` when the
harness is known. Use `--index-since 90d` for stale or long-running projects
rather than starting unbounded. If the clue involves a handoff, worker, subagent,
delegation, reviewer pass, or another agent's branch, commit, or PR, retry with
`--workers` before concluding that the session is absent.

## Widen only while the evidence is missing

Use [query-strategy.md](references/query-strategy.md). Increase `--index-since`,
remove `--cwd`, try synonyms, then omit `--max-sources` for a fuller refresh.
Check `agent-session-find status` when index size affects that choice. After the
first successful refresh use `--no-refresh` for searches against the same index,
following the setup reference's refresh rules.

Inspect result cards before opening logs. Apply
[result-handling.md](references/result-handling.md) before reading local JSONL.
Stop when the relevant session supports the answer; return exact identifiers
and only the necessary evidence.
