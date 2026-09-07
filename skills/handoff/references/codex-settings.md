# Codex launch settings

Default each unspecified setting to `gpt-6-astra` and `medium` reasoning. Preserve the user's model and effort choices independently, including choices already made for this task. This applies to Codex destinations from any harness, not Claude sessions.

Pass settings through the launcher, not just the prompt. `codex-handoff-tmux` supplies these defaults; use its `--model` and `--reasoning-effort` flags for overrides. Direct interactive launches use `--model` and `-c 'model_reasoning_effort="medium"'`; app launchers use their supported model and effort fields.

Honor the launcher's authority requirements. If it requires an explicit user model request, ask for that choice rather than treating skill invocation as permission or bypassing the restriction. If a setting is unsupported, preserve the brief and report the limitation rather than switching silently.

Record the selected settings in the brief. Report requested settings separately from verified running settings; a queued launch is not proof of the effective configuration.
