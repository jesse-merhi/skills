---
name: ask-claude
description: 'Ask Claude from a non-Claude harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Claude

Use this workflow only when the user says to ask Claude or explicitly invokes
`$ask-claude`. Discussing or linking the skill does not authorize a session.
Do not select it on your own for review, planning, implementation, or a second opinion.

1. Resolve this skill's directory as `<skill-dir>`. Gather the checkout,
   relevant files, objective, and constraints. Batch independent preparation reads.
2. Write one self-contained brief. State the requested output and whether writes
   are allowed. For implementation, name the user-authorized owned scope.
   Tell Claude to close its temporary external session before it finishes.
3. Start a full ACP session with the current Claude configuration. Do not set a
   model or use the current harness's subagent tools. For advice, planning, or
   review, run:

   ```sh
   <skill-dir>/scripts/ask-claude read "<self-contained prompt>"
   ```

   For authorized implementation, run:

   ```sh
   <skill-dir>/scripts/ask-claude write "<self-contained prompt>"
   ```

4. Capture the session ID and result. On long work, give a short update when the
   evidence, direction, or blocker changes. Inspect the evidence and validate
   any edits in the originating session before claiming completion.
5. Verify that the temporary session closed. Close the exact remaining ACP ID
   on success, failure, cancellation, timeout, or early stop. Report cleanup
   failure instead of leaving the session silently active.

Keep the wrapper on `acpx ... claude exec` for one-shot work. Switch to persistent
`prompt` mode only when the user explicitly requests an ongoing cross-harness
conversation. Keep that named session for the conversation and close it when
ended. Report ACP or authentication failures exactly; do not replace the
requested Claude answer with a subagent or self-answer.
