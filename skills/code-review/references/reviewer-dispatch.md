# Dispatch reviewers

Use the round's models and effort from [Step 3](../SKILL.md#3-choose-a-review-mode) and [Step 4](../SKILL.md#4-repeat-rounds-until-only-minor-findings-remain) in place of harness reviewer defaults. Prefer a findings-only role configured for the exact model and effort.

- **T3 Code.** Use `orchestrator_capabilities` and launch with `delegate_task`, setting effort in `target.options`. Follow `AGENTS.md` (`Model turns`) for provider selection (including Antigravity and Cursor fallbacks), effort option names and keeping fast mode off.
- **Native Codex.** Use `spawn_agent` with `fork_turns="none"` only for supported models and settings.
- **Native Claude Code.** Use fresh native `Agent` calls only for supported models and settings.
- **Other harnesses.** Use native subagent tools only for models and settings they support. Require a fresh context with no inherited session history.

Launch the selected reviewers in parallel when supported. Skip any reviewer you cannot launch at high effort with its named model.

Give each fresh reviewer the same stable commit or recorded patch, base, full diff, requirements, standards, reusable proof and the selected review lenses (both by default). Leave out implementation rationale, simplifier conclusions and prior findings. Never resume an implementer or an earlier reviewer or fork session history.

Reviewers may run permitted read-only probes and fault checks in scratch copies. They do not spawn other reviewers. Keep the reviewed revision unedited until the round is complete and check each result as it arrives.
