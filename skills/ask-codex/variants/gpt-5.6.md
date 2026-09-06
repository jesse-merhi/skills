---
name: ask-codex
description: 'Ask Codex from a non-Codex harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Codex

Run only when the user explicitly asks to ask Codex or invokes `$ask-codex`.

## Send the brief

Give Codex the objective, checkout, relevant files, constraints, expected output, and permitted write scope. Tell it to archive its temporary task with `set_thread_archived` before finishing.

For advice, review, or planning:
```sh
ask-codex read "<self-contained prompt>"
```

For explicitly authorized implementation:
```sh
ask-codex write "<self-contained prompt>"
```

Use the current Codex configuration and one fresh full ACP session, not an in-chat subagent. Use a persistent named session only for an explicitly requested ongoing conversation.

## Return the result and archive

Record the task/session ID, inspect the evidence, and validate any edits in the originating session. Verify self-archival. If it did not happen, archive that exact task with `set_thread_archived`, or `codex archive <id>` when the tool is unavailable. Do this after success, failure, cancellation, timeout, or early stop; archive a requested persistent session when its conversation ends.

Report the result and any archival failure with its ID. If ACP or authentication fails, report that failure rather than substituting another agent or your own answer.
