# Hand implementation to Codex

Use GPT-6.2 Sol at `xhigh` for Claude and Gemini implementation, including tests, documentation and review fixes. Give Sol the goal, owned files, constraints and acceptance checks. Let it choose the implementation. Inspect the returned diff and independently verify the result. Route further edits through Sol. Leave any edit the host will not let you delegate pending and report why.

In T3 Code, use a Codex connection verified as signed in with ChatGPT in the provider settings. Use `orchestrator_capabilities` for the instance ID, model and effort. A display name alone does not verify sign-in. Call `delegate_task` with `role: "implementation"`, `target.providerInstanceId` set to the verified connection, `target.model: "gpt-6.2-sol"` and `target.options: [{id: "reasoningEffort", value: "xhigh"}]`. Follow the launcher's continuation. If sign-in cannot be verified, report it. Ask Jesse before using an API-key connection.

Outside T3 Code, use the installed Codex CLI in the assigned worktree. Run `env -u CODEX_API_KEY -u OPENAI_API_KEY codex login status` first and confirm it reports ChatGPT sign-in. Clear both variables for the launch to keep an inherited API key from overriding the saved login. Pass the implementation brief on standard input.

```sh
env -u CODEX_API_KEY -u OPENAI_API_KEY codex exec \
  -m gpt-6.2-sol -c 'model_reasoning_effort="xhigh"' \
  -c 'model_provider="openai"' -c 'forced_login_method="chatgpt"' \
  -s workspace-write - < task-brief.md
```

If the launcher, model or subscription is unavailable, leave implementation blocked and report why.
