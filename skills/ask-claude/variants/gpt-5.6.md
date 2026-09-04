---
name: ask-claude
description: 'Ask Claude from a non-Claude harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Claude

Return Claude's independent answer through a full ACP session. Run this only
when the user explicitly invokes `$ask-claude` or asks you to ask Claude.
A mention, link, review request, or desire for another opinion is insufficient.

Resolve `<skill-dir>` to this skill's directory. Prepare a self-contained brief
with the objective, checkout, relevant files, constraints, output, write scope,
and the requirement to close the temporary session before finishing.

For advice, review, or planning:

```sh
<skill-dir>/scripts/ask-claude read "<self-contained prompt>"
```

For explicitly authorized implementation, name the owned scope and use:

```sh
<skill-dir>/scripts/ask-claude write "<self-contained prompt>"
```

Use the current Claude configuration without hard-coding a model. The default
is one fresh `acpx ... claude exec` session, not an in-chat subagent. Use persistent
`prompt` mode only for an explicitly requested ongoing cross-harness conversation;
close that named session when the user ends it.

Inspect the returned evidence and validate edits in the originating session.
Require temporary-session self-cleanup and verify it. On success, failure,
cancellation, timeout, or early stop, close any exact remaining ACP session ID.
Report cleanup failures. If ACP or authentication fails, report the actual
failure; do not substitute another agent or your own answer for Claude's.
