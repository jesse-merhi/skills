# Codex launch settings

Preserve the user's model and effort choices independently, including choices already made for this task. When no model is specified, or the user asks for their configured default, omit the model override wherever the launcher supports it. Do not replace that omission with a coordinator model from `AGENTS.md` or ask the user to choose again. A new session uses the destination's configured default; a fork may inherit its source session's settings.

Pass explicit choices through the launcher, not just the prompt. `codex-handoff-tmux` accepts an optional `--model` and a separate `--reasoning-effort`; its effort fallback remains `medium`. When effort is unspecified, follow the applicable `AGENTS.md` effort policy within the launcher's supported settings. Direct interactive and app launchers use their supported model and effort fields.

Follow the launcher's contract. For example, Codex app task creation permits a model override only when the user explicitly requests that model; otherwise omit the field. If a destination requires a model and offers no configured-default path, ask only for that missing choice. If an explicit model or effort is unsupported, preserve the brief and report the limitation without silently substituting a setting or launching a replacement session.

Record explicit choices, any omitted settings, and the reason for a selected effort in the brief. Report requested settings separately from verified running settings; a queued launch is not proof of the effective configuration.
