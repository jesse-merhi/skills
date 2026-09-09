---
name: ask-claude
description: 'Ask Claude from a non-Claude harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Claude

Run only when the user explicitly asks to ask Claude or invokes `$ask-claude`.

## Send the brief

Give Claude the objective, checkout, relevant files, constraints, expected output, and permitted write scope.

For advice, review, or planning:
```sh
ask-claude read "<self-contained prompt>"
```

For explicitly authorized implementation:
```sh
ask-claude write "<self-contained prompt>"
```

Use the current Claude configuration and one fresh `acpx ... claude exec` session, not an in-chat subagent. For an explicitly requested ongoing conversation, use named persistent `prompt` mode outside this launcher and its no-history environment. Retain that session ID and answer, then close that exact session when the conversation ends; closing stops execution without archiving or deleting history.

## Return the result and close

For temporary sessions, the launcher disables native history for this invocation and lets ACP handle execution teardown. It streams the answer and saves the raw response and errors in the private run directory printed on stderr. Temporary helpers cannot be resumed; no existing history is deleted.

Check the command's exit status, then retrieve the answer and verify the exact native session:
```sh
ask-claude inspect <run-directory>
```

Run this check after success, failure, timeout, cancellation, or interruption. If no run directory was printed, launch failed before Claude started. Retain the run directory with the task evidence and validate any edits yourself. Unresolved identity, remaining processes, or unexpected history is a cleanup failure; report it without claiming the child closed itself.

Report the result and any cleanup failure. If ACP or authentication fails, report that failure rather than substituting another agent or your own answer.
