---
name: ask-claude
description: 'Ask Claude from a non-Claude harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Claude

Run only when the user explicitly asks to ask Claude or invokes `$ask-claude`.

Keep this to one requested session; do not add an optional review team.

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

## Return the result

The launcher runs one temporary Claude session with saved history disabled; ACP handles timeout, cancellation, and execution teardown. It returns Claude's output and exit status. Temporary sessions cannot be resumed; no existing history is deleted.

Check the exit status, report the answer, and validate any edits yourself. If ACP or authentication fails, report that failure rather than substituting another agent or your own answer.
