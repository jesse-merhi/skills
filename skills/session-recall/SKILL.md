---
name: session-recall
description: Find prior local Codex or Claude agent sessions with the agent-session-find CLI. Use when context may exist in previous sessions, after compaction or handoff, before asking the user to remember prior work, when searching for old fixes, decisions, commands, errors, file paths, repo context, review outcomes, or "where did we handle this before?" Keep session contents local and use low-token search results before opening full logs.
---

# Session Recall

Use `agent-session-find` as the first recall step when previous agent work may answer the current question. The goal is to recover the right full session with minimal tokens, not to dump transcripts into context.

## Command Setup

Prefer the installed binary:

```sh
agent-session-find --help
```

If it is unavailable and this checkout is present, use the wrapper:

```sh
./agent-session-find --help
```

Do not upload session contents or paste whole session logs into external tools.
The CLI reads local Codex and Claude JSONL stores and writes a local SQLite
FTS index. When working in another harness, use that harness's equivalent
local session store or recall tool if one exists; keep the same privacy rule
and search only local transcript data.

If the default index path is not writable in the current sandbox, set an explicit local database:

```sh
agent-session-find --db /private/tmp/session-recall.sqlite --index-since 14d --max-sources 80 "<query>"
```

Do not run parallel refreshes against the same SQLite database. Use sequential searches, `--no-refresh` after the first refresh, or separate `--db` paths.

## Recall Workflow

1. Start with a recent, bounded fuzzy query.

```sh
agent-session-find --index-since 14d --max-sources 80 "sample-app export ui"
```

2. Add repo or cwd context when the project is known.

```sh
agent-session-find --cwd sample-app --since 30d "export bugs"
```

3. Search one source when the likely harness is known.

```sh
agent-session-find --source codex "review state tracker"
agent-session-find --source claude "mobile build workflow"
```

If the relevant work happened in another harness, prefer its native local
history or a configured `agent-session-find` source for that harness before
asking the user to reconstruct context from memory.

4. If nothing matches, widen gradually: increase `--index-since`, remove `--cwd`, try synonyms, then omit `--max-sources` for a fuller local refresh.

5. If the user mentions a handoff, worker, subagent, delegated implementation, reviewer pass, branch, commit, or PR opened by another agent, retry with `--workers`. Normal recall excludes worker transcripts by default, but parent sessions keep compact worker handoff/completion summaries.

```sh
agent-session-find --workers --cwd sample-app "effect discipline eslint PR"
```

6. If running several follow-up searches against the same index, add `--no-refresh` after the first successful refresh.

7. Inspect the low-token result cards first. Prefer results with matching `cwd`, `repo`, `terms`, recent timestamp, and `session: full`. Prefer `session: worker/subagent` only when the user is specifically asking for delegated worker output.

8. Open or grep the source path only after choosing a likely result. Pull only the narrow lines needed for the task. For `session: worker/subagent`, treat the result as a local transcript, not a normal user-owned sidebar thread; use `src` for the JSONL and `parent` for the coordinator session.

## Query Strategy

Use the words the user or agent likely typed, not a perfect summary. Good query terms include:

- product or repo names: `sample-app`, `agent-session-find`
- visible feature words: `export ui`, `mobile build`, `database restore`
- error text or symbols: `missing_symbol`, `No such file`
- workflow labels: `code review`, `test-audit`, `installer`
- delegation labels: `handoff`, `worker`, `subagent`, `PR 505`, `branch`
- file or command fragments: `Cargo.toml`, `install.sh`, `bun run check`

Run two or three short searches instead of one long paragraph. Keep exact phrases for rare terms and use broader words for fuzzy recall.

## Result Handling

Treat search results as routing metadata:

- `title` tells whether the session topic sounds right.
- `match` and `terms` show why it matched.
- `cwd` and `repo` tell whether it belongs to the current codebase.
- `session id` and `source` point to the local JSONL if deeper inspection is needed.
- `session: worker/subagent` means a delegated Codex Desktop worker transcript. It is searchable local JSONL, but may not be reopenable or unarchivable through normal Codex thread APIs.
- snippets are enough for most routing decisions.

Do not assume a result proves the old decision is still correct. Use it to find context, then verify current code or docs before acting.

Do not create, restore, archive, pin, rename, or mutate Codex threads while doing recall unless the user explicitly delegated thread orchestration. If a worker transcript needs restore investigation, pause before changing Codex app SQLite state.

## Defaults

Use these defaults unless the task suggests otherwise:

```sh
agent-session-find --index-since 14d --max-sources 80 "<query>"
agent-session-find --cwd "<repo-name>" --since 30d "<query>"
agent-session-find --limit 5 "<query>"
```

For stale or long-running projects, prefer `--index-since 90d` over an unbounded first pass. Run `agent-session-find status` when you need to see index size before widening.
