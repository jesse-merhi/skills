# Model Gate

`gpt-5.5` is the standard Codex review model. Treat any other Codex review
model as a deliberate user-approved exception, not as a helper default.

Claude review uses the Claude Code `default` alias with `max` effort. The
current expected Claude Code default model behind this policy is Opus 4.8
(`opus[1m]`). Treat a different default model as a stop-and-update event.
Higher-family models appearing elsewhere in the Claude catalog are
informational unless the `default` alias changes.

Before the first review phase in every `code-review` run, resolve
`<skill-dir>` to the directory containing `SKILL.md`, then run:

```sh
<skill-dir>/scripts/check-review-models
```

The gate checks native model catalogs:

- `codex debug models` must still report `gpt-5.5` as the top visible Codex
  model.
- Claude Code's Agent SDK initialization catalog must still report `default`
  as Opus 4.8 with `max` effort support.
- Claude Code's Agent SDK initialization catalog reports higher-family model
  availability as informational context without blocking the review.

The Claude check installs `@anthropic-ai/claude-agent-sdk` into a local cache on
first use, then reads `initializationResult().models` from Claude Code without
sending a prompt or running a paid completion.

For manual inventory checks, run:

```sh
<skill-dir>/scripts/check-review-models --check-api-inventory
```

That optional API path uses `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` when they
are present. It can show a new model exists in the authenticated account, but it
does not say which model Codex or Claude Code recommends for review work. The
default Phase 1 gate stays on the Codex CLI and Claude Code SDK catalogs.

If official guidance names a newer or better recommended Codex model than
`gpt-5.5`, if the Codex catalog ranks another visible model above `gpt-5.5`, if
Claude Code's catalog changes the default away from Opus 4.8, stop the entire
review process before Phase 1. Tell the user the model named by the catalog,
the source checked, and that `code-review` / `scripts/codex-review` need an
update. Do not run native review, cold review, subagents, tests, or fix loops
until the user approves how to proceed.

If the freshness check cannot be completed, stop before Phase 1 and tell the
user the check failed. This check is required to avoid silently reviewing with
stale model assumptions.
