# Codex launch settings

Use the coordinator defaults from the model policy in the applicable `AGENTS.md` when the user has not selected a model or effort. Preserve the user's model and effort choices independently, including choices already made for this task.

Pass settings through the launcher, not just the prompt. `codex-handoff-tmux` already defaults to the coordinator settings; pass `--model` and `--reasoning-effort` when preserving an explicit user choice. Direct interactive and app launchers use their supported model and effort fields.

Honor the launcher's authority requirements. If it requires an explicit user model request, ask for that choice rather than treating skill invocation as permission or bypassing the restriction. If a setting is unsupported, preserve the brief and report the limitation rather than switching silently.

Record the selected settings and a short reason for the effort choice in the brief. Report requested settings separately from verified running settings; a queued launch is not proof of the effective configuration.
