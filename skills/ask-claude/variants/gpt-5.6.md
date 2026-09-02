---
name: ask-claude
description: 'Ask Claude from a non-Claude harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Claude

Outcome: return an independently produced Claude result from one full ACP
session. This is not a subagent; use the external session workflow below.

Authority: invoke this skill only when the current user explicitly asks to run
`$ask-claude` or explicitly says to ask Claude. Never auto-select it for review,
planning, a second opinion, delegation, or implementation. Mentioning,
discussing, or linking this skill is not authorization to run it.

## Workflow

1. Resolve `<skill-dir>` to this skill's directory.
2. Give Claude a self-contained brief: objective, checkout, relevant files,
   constraints, expected output, whether writes are authorized, and the
   requirement to close its own temporary external session before finishing.
3. For advice, review, or planning, run the read-only wrapper:

   ```sh
   <skill-dir>/scripts/ask-claude read "<self-contained prompt>"
   ```

4. Use write mode only when the user authorized implementation and the brief
   names the owned scope:

   ```sh
   <skill-dir>/scripts/ask-claude write "<self-contained prompt>"
   ```

5. Treat the result as another full session's work. Inspect its evidence and
   validate any edits in the originating session before reporting completion.
6. A one-shot ACP session is temporary. Require the spawned Claude session to
   close itself before finishing, then verify no persistent session was left
   behind. The wrapper must stay on `acpx ... claude exec`; never switch to the
   persistent `prompt` mode unless the user explicitly requests an ongoing
   cross-harness conversation. On failure, cancellation, timeout, or early
   stop, close any exact session ID returned by ACP and report cleanup failure
   instead of silently leaving the session behind.

The wrapper uses the current Claude configuration; do not hard-code a model.
Use a fresh one-shot ACP session by default. Continue a persistent named session
only when the user explicitly asks for an ongoing cross-harness conversation.
Close that named session when the user ends the conversation.

If ACP or Claude authentication fails, report the exact failure. Do not silently
replace the requested Claude session with a subagent or self-answer.
