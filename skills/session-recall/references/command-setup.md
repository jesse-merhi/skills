# Command setup

Source and install instructions: https://github.com/jesse-merhi/agent-session-finder

Prefer the installed binary:

```sh
agent-session-find --help
```

If it is unavailable and this checkout is present, use the wrapper:

```sh
./agent-session-find --help
```

The CLI reads local Codex and Claude JSONL stores and writes a local SQLite FTS
index. When working in another agent tool, use that agent tool's equivalent
local session store or recall tool if one exists; keep the same privacy rule and
search only local transcript data.

If the default index path is not writable in the current sandbox, set an
explicit local database:

```sh
agent-session-find --db /private/tmp/session-recall.sqlite --index-since 14d --max-sources 80 "<query>"
```

Do not run parallel refreshes against the same SQLite database. Use sequential
searches, `--no-refresh` after the first refresh, or separate `--db` paths.
