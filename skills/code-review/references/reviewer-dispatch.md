# Dispatch reviewers

Use the models and effort from [Step 3](../SKILL.md#3-choose-a-review-mode) in place of harness reviewer defaults. Prefer a findings-only role configured for the exact model and effort.

- **T3 Code.** Use `orchestrator_capabilities` to resolve provider and model IDs and supported options. Launch with `delegate_task` and set effort in `target.options`. For Gemini 4 Neon, select an authenticated Antigravity provider with its High thinking setting, or Cursor with `reasoning_effort` set to `high`. Cursor can also run Claude Opus 5.5 and Fable 5.2 at high when no Claude provider is available; keep its fast mode off.
- **Native Codex.** Use `spawn_agent` with `fork_turns="none"` only for supported models and settings.
- **Native Claude Code.** Use fresh native `Agent` calls only for supported models and settings.
- **Other harnesses.** Use native subagent tools only for models and settings they support. Require a fresh context with no inherited session history.

In council mode, launch every available member in parallel when supported. Skip any member you cannot launch at high effort with its named model. During intermediate UI polish gating rounds, the latest council's lowest scorer may review alone under the UI polish rules.

Give each fresh reviewer the same stable commit or recorded patch, base, full diff, requirements, standards, reusable proof and the selected review lenses (both by default). Leave out implementation rationale, simplifier conclusions and prior findings. Never resume an implementer or an earlier reviewer or fork session history.

Reviewers may run permitted read-only probes and fault checks in scratch copies. They do not spawn other reviewers. Keep the reviewed revision unedited until the round is complete and check each result as it arrives.
