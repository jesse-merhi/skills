---
name: ask-claude
description: 'Ask Claude from a non-Claude harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Claude

Run only when the user explicitly asks to ask Claude or invokes `$ask-claude`.

## Send the brief

Give Claude the objective, checkout, relevant files, constraints, expected output, and permitted write scope. Tell it to close its temporary session before finishing.

For advice, review, or planning:
```sh
ask-claude read "<self-contained prompt>"
```

For explicitly authorized implementation:
```sh
ask-claude write "<self-contained prompt>"
```

Use the current Claude configuration and one fresh `acpx ... claude exec` session, not an in-chat subagent. Use persistent `prompt` mode only for an explicitly requested ongoing conversation.

## Return the result and close

Record the session ID, inspect the evidence, and validate any edits in the originating session. Verify self-cleanup; close that exact session if it remains after success, failure, cancellation, timeout, or early stop. Close a requested persistent session when its conversation ends.

Report the result and any cleanup failure. If ACP or authentication fails, report that failure rather than substituting another agent or your own answer.
