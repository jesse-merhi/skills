---
name: session-recall
description: Find prior local Codex or Claude sessions; keep contents local and inspect cards before opening logs.
---

# Session recall

Find the relevant prior full session without exposing more transcript than needed.
Keep all session contents local. Do not edit logs, upload them, or paste whole
logs into external tools.

1. Read [command-setup.md](references/command-setup.md) for the command, privacy,
   database, and parallel-refresh rules. Use `agent-session-find` first when
   earlier agent work may answer the question.
2. Start with a bounded query:

   ```sh
   agent-session-find --index-since 14d --max-sources 80 "<query>"
   ```

   For a known project use `agent-session-find --cwd "<repo-name>" --since 30d "<query>"`.
   Use `--source codex` or `--source claude` when the harness is known, and
   `--limit 5` for short results. For old or long-running projects use
   `--index-since 90d` instead of an unbounded first search.
3. If the clue mentions a handoff, worker, subagent, delegated implementation,
   reviewer pass, or another agent's branch, commit, or PR, retry with `--workers`.
4. After a successful refresh, add `--no-refresh` to follow-up queries against
   that index. Batch independent bounded queries at this stage. Use
   [query-strategy.md](references/query-strategy.md) to choose terms.
5. If there is no match, increase `--index-since`, remove `--cwd`, try synonyms,
   then omit `--max-sources` for a fuller refresh. Use `agent-session-find status`
   if index size matters before widening.
6. Inspect low-token cards first. Read [result-handling.md](references/result-handling.md)
   before opening a local JSONL log. Return the matching identifiers and supported
   answer. Quote copied wording and distinguish it from your summary.

During a long search, report changed matches or blockers. Preserve original
session history; recall does not authorize rewriting it.
