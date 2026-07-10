# Model Gate

`gpt-5.6-sol` is the standard Codex review model. Treat any other Codex review
model as a deliberate user-approved exception, not as a helper default.

Claude review uses the Claude Code `claude-fable-5[1m]` model with `high`
effort. Codex uses `xhigh` reasoning. Treat a missing or renamed selected model,
or either model losing its configured effort level, as a stop-and-update event.
Higher-family models appearing elsewhere in the Claude catalog are
informational unless the selected Fable model changes.

Before the first review phase in every `code-review` run, resolve
`<skill-dir>` to the directory containing `SKILL.md`, then run:

```sh
<skill-dir>/scripts/check-review-models
```

The gate checks native model catalogs:

- `codex debug models` must still list `gpt-5.6-sol` with `xhigh` reasoning
  support.
- Claude Code's Agent SDK initialization catalog must still report
  `claude-fable-5[1m]` as Fable 5 with `high` effort support.
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
`gpt-5.6-sol`, if the Codex catalog removes `gpt-5.6-sol` or its `xhigh`
support, or if Claude Code's catalog changes or removes Fable 5, stop the entire
review process before Phase 1. Tell the user the model named by the catalog,
the source checked, and that `code-review` / `scripts/codex-review` need an
update. Do not run native review, cold review, subagents, tests, or fix loops
until the user approves how to proceed.

If the freshness check cannot be completed, stop before Phase 1 and tell the
user the check failed. This check is required to avoid silently reviewing with
stale model assumptions.
