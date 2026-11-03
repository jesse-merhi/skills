---
name: ask-claude
description: 'Ask Claude from a non-Claude harness using an available T3 account or a standalone ACP session for advice or scoped implementation.'
---

# Ask Claude

Run only when the user explicitly asks to ask Claude or invokes `$ask-claude`.

## In T3 Code

Use T3’s `delegate_task` for a child on the requested provider. Do not invoke the standalone launcher, create a top-level thread, or substitute a native in-chat agent for this route.

1. Read `orchestrator_capabilities` once per thread before the first delegation; reuse it until an error or a user-named provider change requires a refresh. Consider every entry with `driverKind: "claudeAgent"`, including separately named accounts. Keep runnable entries (`canRunChildTask`, and `canRunCrossProviderChildTask` when crossing providers), respecting their constraints. Use the returned `providerInstanceId`, not an assumed default or the first entry automatically.
2. Check any current account/model usage information exposed by the available T3 tools or already supplied in the task. Prefer an eligible account with remaining allowance; exclude accounts whose applicable session, weekly, or model limit is exhausted until its reported reset. A model-specific limit need not exclude other models. Authentication and `canRunChildTask` alone do not prove remaining quota. If usage is absent, stale, or unavailable, say it is unknown and try an eligible account; do not invent a quota endpoint, inspect credentials, or stop just because quota cannot be read.
3. Honor an explicit account, model, and effort choice. With no account pinned, try the requested model on other eligible accounts before changing models. Default to Opus 5.5 at medium effort (`effort`) when available. Without an explicit model choice, another available Claude model suited to the task is allowed; prefer Fable for substantive advice and Sonnet or Haiku for simpler work. Search the capability catalog when the desired model is omitted from its short list. Never silently downgrade an explicit model or switch provider families; report unavailable choices when no eligible account supports them.
4. Pass the chosen account, model and only supported options through `target.providerInstanceId`, `target.model` and `target.options`. Give the child the objective, checkout, relevant files, constraints, expected output and permitted write scope. Advice/review is findings-only with no edits or publication; implementation requires existing write authority. Keep the parent’s permission ceiling; an approval mode is not a read-only sandbox.
5. Keep the returned `taskId` and follow `next` and host completion instructions. A wait timeout or pending approval is not an account failure.
6. Return the answer and evidence, validate any edits, and name the account/model actually used and any fallback. If every eligible choice fails, report the observed failures and known reset times. Leave T3 child lifecycle with T3; the standalone archival instructions below do not apply here.

### Account failures

On a confirmed quota/rate-limit, authentication or account-specific model-access failure:

1. Inspect the result and refresh capabilities.
2. Cancel the old task with `task_cancel` before replacing it, even if it failed; T3 may resume quota-limited tasks automatically.
3. Reconcile any file changes or external effects. Give the replacement only the remaining work.
4. Unless the user pinned the account, try another eligible account of the same provider without asking again.

Try each eligible account/model pair at most once per invocation. Do not duplicate work or retry unrelated task failures across accounts.

## Outside T3 Code

The launcher selects Opus 5.5 with medium effort for each new session, independently of the global Claude defaults.

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
