---
name: ask-claude
description: 'Ask Claude from a non-Claude harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Claude

Produce one independently supported Claude result through a full ACP session,
inspect its evidence, and leave no unintended external session running. This
workflow requires the user's explicit `$ask-claude` invocation or request to
ask Claude. A mention, link, or general request for review or implementation is
not permission to launch it.

Prepare one compact, self-contained brief: objective, checkout, relevant files,
constraints, expected output, write authority and owned scope, plus an instruction
for the temporary session to close itself before finishing. Resolve
`<skill-dir>` to this skill's directory and choose:

```sh
# Read-only advice, review, or planning
<skill-dir>/scripts/ask-claude read "<self-contained prompt>"
# User-authorized implementation within the brief's owned scope
<skill-dir>/scripts/ask-claude write "<self-contained prompt>"
```

Use the current Claude configuration and a fresh `acpx ... claude exec` session.
Do not hard-code a model, replace it with an in-chat subagent, or surround the
result with an optional review team. The originating session inspects evidence
and validates edits as part of accepting the result.

Completion includes verified cleanup. Require self-closure, then close any exact
ACP session left behind on success, failure, cancellation, timeout, or early stop.
Report an unresolved cleanup failure and its ID. Only an explicit request for
an ongoing cross-harness conversation permits persistent `prompt` mode; close
that named session when the conversation ends.

Return a concise supported answer or the exact ACP/authentication failure.
Never silently substitute a self-answer for the requested Claude result.
