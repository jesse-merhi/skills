---
name: session-recall
description: Use when the user refers to earlier work, or when a decision from a past Codex or Claude session is needed.
---

# Session recall

Find the relevant prior session with `agent-session-find` first. Report useful progress if the search takes a while.

Prefer the installed command; use `./agent-session-find` in its source checkout if unavailable, or another harness's local recall tool when appropriate. See `--help` for filters and index options.

```sh
agent-session-find --index-since 14d --max-sources 80 --limit 5 "<query>"
```

Search likely terms: repo names, errors, filenames or feature words, and widen terms and date limits as needed. Include worker transcripts for handoffs or delegated work. Skip the index refresh on follow-up queries, and never refresh the same database concurrently.

Check result cards for topic, repository, date and matching text, then read relevant log excerpts. Prefer full sessions unless seeking worker output. Worker transcripts may not reopen as sidebar tasks: `src` locates the log and `parent` the coordinator.

Return the session identifier and the evidence-supported answer, distinguishing quotations from summaries. Old decisions are context, not proof of current correctness; verify current code or docs before acting.

Keep transcripts local and unchanged; never upload them. Recall alone does not authorize thread management or edits to the app's database.

## References

- [Source checkout](https://github.com/jesse-merhi/agent-session-finder): fallback location when the installed command is unavailable.
