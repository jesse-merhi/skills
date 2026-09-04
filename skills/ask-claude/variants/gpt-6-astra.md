---
name: ask-claude
description: 'Ask Claude from a non-Claude harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Claude

An explicit request to ask Claude authorizes this full-session workflow.
A reference to the skill or an ordinary review, planning, delegation, or
implementation request does not. Do not launch it automatically.

## Prepare and launch the authorized request

Resolve `<skill-dir>` to this skill's directory. Use the request and checkout
to build a brief containing the objective, relevant files, constraints, expected
output, owned scope, write permission, and temporary-session cleanup obligation.
Resolve routine briefing details from available evidence; ask only if an
unresolved user decision changes the permitted work.

Choose the matching wrapper:

```sh
# Advice, planning, or review
<skill-dir>/scripts/ask-claude read "<self-contained prompt>"
# Implementation explicitly authorized for the scope in the brief
<skill-dir>/scripts/ask-claude write "<self-contained prompt>"
```

Keep the current Claude model configuration. Use one fresh full ACP session via
`acpx ... claude exec`, never an in-chat substitute. Persistent `prompt` mode is
reserved for an explicitly requested ongoing cross-harness conversation.

## Capture the result and finish the session

Inspect Claude's evidence and validate any edits in the originating session.
Carry the request through cleanup without a second permission round: require
the temporary session to close itself, verify closure, and close any exact
remaining ACP ID even after failure, cancellation, timeout, or early stop.
For a requested persistent session, close it when the user ends the conversation.

Report the supported result and any validation or cleanup limits. ACP and
authentication failures must remain visible; do not silently answer yourself or
replace Claude with a subagent.
