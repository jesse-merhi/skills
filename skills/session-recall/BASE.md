---
name: session-recall
description: Find prior local Codex or Claude sessions.
---

# Session recall

Find the relevant prior session with `agent-session-find` first.

Prefer the installed command; use `./agent-session-find` in its source checkout if unavailable. Use `--help` for options, or another harness's local recall tool when appropriate.

```sh
agent-session-find --index-since 14d --max-sources 80 --limit 5 "<query>"
```

Search likely terms: repo names, errors, filenames or feature words. Filter by `--cwd` or `--source` when known; widen terms and date/source limits as needed. Include `--workers` for handoffs or delegated work.

The command maintains a local SQLite index. Reuse it with `--no-refresh` for follow-up queries; refresh when expanding indexed coverage. Never refresh the same database concurrently. Use `--db <writable-local-path>` if needed.

Check result cards for topic, repository, date and matching text, then read relevant log excerpts. Prefer full sessions unless seeking worker output. Worker transcripts may not reopen as sidebar tasks: `src` locates the log and `parent` the coordinator.

Return the session identifier and the evidence-supported answer, distinguishing quotations from summaries. Old decisions are context, not proof of current correctness; verify current code or docs before acting.

Keep transcripts local and unchanged; never upload them. Recall alone does not authorize thread management or edits to the app's database.

## References

- [Source checkout](https://github.com/jesse-merhi/agent-session-finder): fallback location when the installed command is unavailable.
