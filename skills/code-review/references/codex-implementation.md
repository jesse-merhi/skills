# Hand off implementation

`AGENTS.md` (`Model turns`) owns delegation exceptions, effort caps, the fast-mode ban and T3 Code provider/option routing. Claude and Gemini coordinators delegate implementation edits, including tests, documentation and review fixes, to the first implementer that can start, in this order:

1. GPT-6.2 Sol at `xhigh`
2. Gemini 4 Neon at `high`
3. Claude Opus 5.5 at `high`
4. GPT-6.2 Astra at `xhigh`
5. Claude Sonnet 5.5 at `high`
6. Claude Fable 5.2 at `high`

If the launcher, model, account, subscription or spend cap rules one out, move to the next without asking. In the final reply, name the model that did the work and why earlier ones were skipped. If none can start, leave the edit pending and report why.

Give the implementer the goal, owned files, constraints and acceptance checks. Let it choose the implementation. Inspect the returned diff and independently verify the result. Route further edits through the same implementer while it stays available. If the host explicitly forbids delegating a small review fix, apply it directly and disclose it. For other edits the host won't let you delegate, report the blocker and leave the edit pending.

## Codex models: Sol and Astra

In T3 Code, use a Codex connection verified as signed in with ChatGPT in the provider settings. Use `orchestrator_capabilities` for the instance ID, model and effort. A display name alone does not verify sign-in. Call `delegate_task` with `role: "implementation"`, `target.providerInstanceId` set to the verified connection, `target.model: "gpt-6.2-sol"` (or `"gpt-6.2-astra"`) and `target.options: [{id: "reasoningEffort", value: "xhigh"}]`. Follow the launcher's continuation.

Outside T3 Code, use the installed Codex CLI in the assigned worktree. Run `env -u CODEX_API_KEY -u OPENAI_API_KEY codex login status` first and confirm it reports ChatGPT sign-in. Clear both variables for the launch to keep an inherited API key from overriding the saved login. Pass the implementation brief on standard input. For Astra, use `-m gpt-6.2-astra`.

```sh
env -u CODEX_API_KEY -u OPENAI_API_KEY codex exec \
  -m gpt-6.2-sol -c 'model_reasoning_effort="xhigh"' \
  -c 'model_provider="openai"' -c 'forced_login_method="chatgpt"' \
  -s workspace-write - < task-brief.md
```

If no Codex connection is verified as signed in with ChatGPT, skip Sol and Astra without asking. Ask Jesse before using an API-key connection instead.

## Other models

In T3 Code, follow `AGENTS.md` (`Model turns`) with `orchestrator_capabilities` and `delegate_task` (`role: "implementation"`) for provider selection (including Antigravity and Cursor fallbacks), effort option names and keeping fast mode off. In Claude Code, use the `Agent` tool with per-invocation `model` (such as `opus` or `sonnet`) and effort when supported by the launcher; if the launcher can't select the model and effort, treat that model as unavailable. Elsewhere, use the harness's own launcher and skip any model whose model and effort it can't select.
