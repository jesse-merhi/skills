---
name: ask-codex
description: 'Ask Codex from a non-Codex harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Codex

Start this workflow only when the user explicitly invokes `$ask-codex` or asks
you to ask Codex. A link, discussion, or general need for review, planning,
implementation, or a second opinion does not authorize it.

1. Resolve `<skill-dir>` to this skill's directory. Batch independent reads of
   the checkout and relevant context.
2. Prepare a self-contained brief with the objective, checkout, relevant files,
   constraints, expected output, and write authority. Name the owned scope for
   implementation. Tell Codex to archive its external task with
   `set_thread_archived` before finishing.
3. Use the current Codex configuration without hard-coding a model. Start a
   full ACP session, not an in-chat subagent. For advice, planning, or review:

   ```sh
   <skill-dir>/scripts/ask-codex read "<self-contained prompt>"
   ```

   For explicitly authorized implementation:

   ```sh
   <skill-dir>/scripts/ask-codex write "<self-contained prompt>"
   ```

4. Record the created task/session ID. During long work, report only a meaningful
   change or blocker. Capture the result, inspect its evidence, and validate
   edits in the originating session.
5. Verify self-archival. If it did not happen, archive the exact task in caller
   cleanup on success, failure, cancellation, timeout, or early stop. Use
   `set_thread_archived` when available; otherwise run `codex archive <id>`.
   Report the exact ID if archival fails.

Use a fresh one-shot session by default. Keep a persistent named session only
for an explicitly requested ongoing cross-harness conversation, then archive
it when the user ends that conversation. Report ACP or authentication failures
exactly. Do not silently supply a self-answer or another agent's result.
