---
name: ask-codex
description: 'Ask Codex from a non-Codex harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Codex

Complete the exact ACP task the user requested. Batch independent preparation
and validation. For a long external session, give a brief update when the
evidence or direction changes. Keep the brief, edits, and verification inside
the authorized read or write scope. Prefer targeted edits.

Use a full Codex session through ACP. This is not a subagent and must not be
implemented with the current harness's in-chat delegation tools.

Invoke this skill only when the current user explicitly asks to run
`$ask-codex` or explicitly says to ask Codex. Never auto-select it for review,
planning, a second opinion, delegation, or implementation. Mentioning,
discussing, or linking this skill is not authorization to run it.

## Workflow

1. Resolve `<skill-dir>` to this skill's directory.
2. Give Codex a self-contained brief: objective, checkout, relevant files,
   constraints, expected output, whether writes are authorized, and the
   requirement to archive its own external task before finishing.
3. For advice, review, or planning, run the read-only wrapper:

   ```sh
   <skill-dir>/scripts/ask-codex read "<self-contained prompt>"
   ```

4. Use write mode only when the user authorized implementation and the brief
   names the owned scope:

   ```sh
   <skill-dir>/scripts/ask-codex write "<self-contained prompt>"
   ```

5. Record the created Codex task or session ID, treat the result as another
   full session's work, inspect its evidence, and validate any edits in the
   originating session before reporting completion.
6. A one-shot session is temporary. Require the spawned Codex session to
   archive itself with `set_thread_archived` before it finishes. After its
   result has been captured, verify that it is archived. If self-cleanup did
   not happen, archive the exact task in guaranteed caller cleanup on success,
   failure, cancellation, timeout, or early stop. Use `set_thread_archived`
   when the Codex app tool is available; otherwise run `codex archive <id>`.
   If archival fails, report the exact ID instead of silently leaving the task
   behind.

The wrapper uses the current Codex configuration; do not hard-code a model.
Use a fresh one-shot ACP session by default. Continue a persistent named session
only when the user explicitly asks for an ongoing cross-harness conversation.
Keep that session while the conversation is active, then archive it when the
user ends the conversation.

If ACP or Codex authentication fails, report the exact failure. Do not silently
replace the requested Codex session with a subagent or self-answer.
