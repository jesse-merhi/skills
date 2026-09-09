---
name: ask-claude
description: 'Ask Claude from a non-Claude harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Claude

Run only when the user explicitly asks to ask Claude or invokes `$ask-claude`.

Batch independent preparation reads and report meaningful progress during long work.

## 1. Send the brief

Give Claude the objective, checkout, relevant files, constraints, expected output, and permitted write scope.

For advice, review, or planning:
```sh
ask-claude read "<self-contained prompt>"
```

For explicitly authorized implementation:
```sh
ask-claude write "<self-contained prompt>"
```

## 2. Verify and return the result

The launcher creates one temporary Claude session with saved history disabled and automatic execution teardown. It streams the answer and saves the raw response and errors in the private run directory printed on stderr. Temporary helpers cannot be resumed; no existing history is deleted.

Check the command's exit status, then retrieve the answer and verify the exact native session:
```sh
ask-claude inspect <run-directory>
```

Run this check after success, failure, timeout, cancellation, or interruption. If no run directory was printed, launch failed before Claude started. Retain the run directory as task evidence, validate any edits yourself, and report the answer and inspection result. If ACP or authentication fails, report that failure rather than substituting another agent or your own answer.
