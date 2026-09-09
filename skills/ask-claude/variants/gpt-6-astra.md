---
name: ask-claude
description: 'Ask Claude from a non-Claude harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Claude

Use this skill only when the user explicitly invokes `$ask-claude` or asks you to ask Claude. Mentioning or discussing the skill does not authorize a run. Use a full Claude ACP session through the launcher, not an in-chat subagent.

Give Claude a self-contained brief: objective, checkout, relevant files, constraints, expected answer and evidence, and whether writes are authorized. Run from the intended checkout; resolve routine paths and command choices from the brief without asking again. Use the current Claude configuration without choosing a model:

```sh
<skill-dir>/scripts/ask-claude read "<self-contained prompt>"
```

Use `write` instead of `read` only for user-authorized implementation with an explicit owned scope. Inspect the returned evidence and validate edits yourself before reporting completion. Authentication or execution failure is a failure; report it rather than substituting another agent or your own answer.

The launcher owns temporary-session cleanup. It prevents native history writes, retains the answer and raw ACP evidence in the private run directory printed on stderr, and checks process teardown and persisted history separately. Temporary helpers cannot be resumed. Do not ask the child to close itself or treat an empty ACP session list as proof that Claude history is gone.

Check the exit status and reported verification. Keep the run directory with the task evidence, including partial answers and errors when work fails. Before calling the task complete, inspect the answer and any artifacts it references. If the caller or supervisor was interrupted, use its exact run directory:

```sh
<skill-dir>/scripts/ask-claude recover <run-directory>
<skill-dir>/scripts/ask-claude inspect <run-directory>
```

If recovery reports that the supervisor is still active, let its bounded teardown finish before retrying. Recovery stops only a process group with a matching recorded owner. Unknown ownership or unexpected history remains an explicit failure, with the evidence retained. The launcher never deletes history. Further history deletion needs the user's explicit decision.

This launcher accepts only fresh temporary invocations. For an explicitly requested ongoing conversation, use a named persistent ACP session outside this launcher and outside its no-history environment. Closing that conversation stops execution; it does not archive or delete its saved history.

Read [lifecycle behavior](references/lifecycle.md) for storage, recovery limits and the verified native capabilities.
