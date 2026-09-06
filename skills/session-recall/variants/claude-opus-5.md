---
name: session-recall
description: Find prior local Codex or Claude sessions.
---

# Session recall

Find the prior session with `agent-session-find` first. Stop when the evidence answers the question; do not expand into an archive audit.

Prefer the installed command; use `./agent-session-find` in its source checkout if unavailable. Use `--help` for options, or another harness's local recall tool when appropriate.

```sh
agent-session-find --index-since 14d --max-sources 80 --limit 5 "<query>"
```

Search short terms someone likely typed: repo names, errors, filenames, or feature words. Filter by `--cwd` or `--source` when known. Adjust terms and date/source limits to fit the clues, widening when needed rather than following a fixed search sequence. Include `--workers` for handoffs or delegated work.

The command maintains a local SQLite index. Reuse it with `--no-refresh` for follow-up queries; refresh when expanding indexed coverage. Never refresh the same database concurrently. Use `--db <writable-local-path>` if needed.

Inspect result cards for topic, repo, date, and matching text before reading only the relevant log excerpts. Prefer full sessions unless seeking worker output. Worker results are transcripts, not necessarily reopenable sidebar tasks: `src` locates the log and `parent` the coordinator.

Return the session identifier and supported answer, distinguishing quotations from summaries. Old decisions are context, not proof of current correctness; verify current code or docs before acting.

Keep transcripts local and unchanged; never upload them. Recall alone does not authorize thread management or edits to the app's database.

## References

- [Source checkout](https://github.com/jesse-merhi/agent-session-finder): fallback location when the installed command is unavailable.
