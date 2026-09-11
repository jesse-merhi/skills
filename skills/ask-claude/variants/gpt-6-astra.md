---
name: ask-claude
description: 'Ask Claude from a non-Claude harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Claude

Run only when the user explicitly asks to ask Claude or invokes `$ask-claude`.

Resolve routine brief details from the request and checkout; keep unresolved scope decisions with the user.

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

Claude sessions are ephemeral.

Check the exit status, report the answer, and validate any edits yourself. If ACP or authentication fails, report that failure rather than substituting another agent or your own answer.
