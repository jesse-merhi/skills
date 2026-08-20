# Result handling

Treat search results as routing metadata:

- `title` tells whether the session topic sounds right.
- `match` and `terms` show why it matched.
- `cwd` and `repo` tell whether it belongs to the current codebase.
- `session id` and `source` point to the local JSONL if deeper inspection is
  needed.
- `session: worker/subagent` means a delegated Codex Desktop worker transcript.
  It is searchable local JSONL, but may not be reopenable or unarchivable
  through normal Codex thread APIs.
- snippets are enough for most routing decisions.

Prefer results with matching `cwd`, `repo`, `terms`, recent timestamp, and
`session: full`. Prefer `session: worker/subagent` only when the user is
specifically asking for delegated worker output.

Open or grep the source path only after choosing a likely result. Pull only the
narrow lines needed for the task. For `session: worker/subagent`, treat the
result as a local transcript, not a normal user-owned sidebar thread; use `src`
for the JSONL and `parent` for the coordinator session.

Do not assume a result proves the old decision is still correct. Use it to find
context, then verify current code or docs before acting.

Do not create, restore, archive, pin, rename, or mutate Codex threads while
doing recall unless the user explicitly delegated thread orchestration. If a
worker transcript needs restore investigation, pause before changing Codex app
SQLite state.
