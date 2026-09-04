---
name: session-recall
description: Find prior local Codex or Claude sessions; keep contents local and inspect cards before opening logs.
---

# Session recall

Return the relevant prior full session and a concise evidence-backed answer.
Use local `agent-session-find` first when previous agent work may resolve the
question. Do not upload session contents or paste whole logs into external tools.

Read [command-setup.md](references/command-setup.md) for setup, privacy, database,
and refresh constraints. Begin with a bounded search:

```sh
agent-session-find --index-since 14d --max-sources 80 "<query>"
agent-session-find --cwd "<repo-name>" --since 30d "<query>"
agent-session-find --limit 5 "<query>"
```

Select repo/cwd context and `--source codex` or `--source claude` when known.
For stale projects prefer `--index-since 90d` to an unbounded first pass. Retry
with `--workers` when the user mentions a handoff, worker, subagent, delegation,
reviewer pass, or a branch, commit, or PR from another agent.

Use [query-strategy.md](references/query-strategy.md) if terms need refinement.
An unmatched search may widen by increasing `--index-since`, removing `--cwd`,
trying synonyms, then omitting `--max-sources`. Inspect
`agent-session-find status` before widening if index size matters. Reuse a
successfully refreshed index with `--no-refresh` on follow-up queries.

Inspect compact cards first and apply [result-handling.md](references/result-handling.md)
before opening local JSONL. Bound excerpts to the question and stop at the
supported match. Recall does not call for an archive audit or a verifier agent.
