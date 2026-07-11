# Model Gate

Select the review engine before running this gate. In Codex, the default engine
is Codex. In Claude Code, the default is Claude. A user-named engine overrides
the harness default; naming Fable selects Claude. Validate only the selected
engine.

`gpt-5.6-sol` is the standard Codex review model. Treat any other Codex review
model as a deliberate user-approved exception, not as a helper default.

Claude review uses the Claude Code `claude-fable-5[1m]` model with `high`
effort. Codex uses `high` reasoning. Treat a missing or renamed selected model,
or that model losing its configured effort level, as a stop-and-update event.
Higher-family models appearing elsewhere in the Claude catalog are
informational unless the selected Fable model changes.

Before the first review phase in every `code-review` run, resolve
`<skill-dir>` to the directory containing `SKILL.md`, then run:

```sh
<skill-dir>/scripts/check-review-models --engine <codex|claude>
```

The gate checks the selected engine's native model catalogue:

- For Codex, `codex debug models` must still list `gpt-5.6-sol` with `high`
  reasoning support. The gate does not invoke or inspect Claude.
- For Claude, the Agent SDK initialization catalogue must still report
  `claude-fable-5[1m]` as Fable 5 with `high` effort support. The gate does not
  inspect Codex.

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
default Phase 1 gate still checks only the selected engine's native catalogue.

If the selected engine's catalogue removes its configured model or effort,
stop before Phase 1. Tell the user what changed in the selected catalogue and
that `code-review` / `scripts/codex-review` need an update. An unselected
engine never blocks the run and is not a reason to ask the user anything.

If the freshness check cannot be completed, stop before Phase 1 and tell the
user the check failed. This check is required to avoid silently reviewing with
stale model assumptions.
