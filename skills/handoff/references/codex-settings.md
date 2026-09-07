# Codex launch settings

Default an unspecified model to `gpt-6-astra`. Preserve the user's model and effort choices independently, including choices already made for this task.

When effort is unspecified, assess the remaining task from the brief. Choose `low` (light reasoning) for well-scoped, straightforward work with a clear approach and no unresolved decisions. Choose `medium` when any part needs higher-level thinking, such as diagnosis, design, trade-offs, or resolving ambiguity. Use `medium` when the difficulty is uncertain. Decide from the available context without asking the user to classify the task.

Pass settings through the launcher, not just the prompt. With `codex-handoff-tmux`, pass `--model` and the selected `--reasoning-effort low` or `--reasoning-effort medium` explicitly; its fallback remains `medium`. Direct interactive launches use `--model` and `-c 'model_reasoning_effort="low"'` or `-c 'model_reasoning_effort="medium"'`; app launchers use their supported model and effort fields. Substitute an explicit user effort choice for these selected defaults.

Honor the launcher's authority requirements. If it requires an explicit user model request, ask for that choice rather than treating skill invocation as permission or bypassing the restriction. If a setting is unsupported, preserve the brief and report the limitation rather than switching silently.

Record the selected settings and a short reason for the effort choice in the brief. Report requested settings separately from verified running settings; a queued launch is not proof of the effective configuration.
