---
name: ask-claude
description: 'Ask Claude from a non-Claude harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Claude

Use a full Claude session through ACP. This is not a subagent and must not be
implemented with the current harness's in-chat delegation tools.

## Workflow

1. Resolve `<skill-dir>` to this skill's directory.
2. Give Claude a self-contained brief: objective, checkout, relevant files,
   constraints, expected output, and whether writes are authorized.
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

The wrapper uses the current Claude configuration; do not hard-code a model.
Use a fresh one-shot ACP session by default. Continue a persistent named session
only when the user explicitly asks for an ongoing cross-harness conversation.

If ACP or Claude authentication fails, report the exact failure. Do not silently
replace the requested Claude session with a subagent or self-answer.
