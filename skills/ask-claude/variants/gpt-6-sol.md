---
name: ask-claude
description: 'Ask Claude from a non-Claude harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Claude

Run only when the user explicitly asks to ask Claude or invokes `$ask-claude`.

Resolve routine brief details from the request and checkout. Keep unresolved scope decisions with the user.

Give Claude the objective, checkout, relevant files, constraints, expected output, and permitted write scope.

For advice, review, or planning:
```sh
ask-claude read "<self-contained prompt>"
```

For explicitly authorized implementation:
```sh
ask-claude write "<self-contained prompt>"
```

The session is ephemeral. Check the exit status, report the answer, and validate any edits yourself. If ACP or authentication fails, report it rather than substituting another agent or your own answer.
