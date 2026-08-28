# Troubleshooting

- Run `<skill-dir>/scripts/openclaw-local-test --inspect` first. An unavailable Codex route needs a
  successful `codex login status`; an unavailable Claude route needs a
  successful `claude auth status --json`.
- Codex mode deliberately uses the native user Codex home. If the model requires
  API-key billing, that home must use API-key auth. If it requires subscription
  billing, that home must use ChatGPT auth. Codex custom provider and endpoint
  settings remain in `config.toml`; the helper does not duplicate them.
- Claude mode deliberately calls the installed Claude CLI. Confirm `claude` is
  on the Gateway process `PATH` and that the same host login works outside
  OpenClaw.
- If a base config still uses `agents.list`, run `openclaw doctor --fix`
  against that config before retrying. The helper does not maintain a second
  roster migration.
- Read `~/.openclaw-local-test/logs/gateway.err.log` first after runtime or
  model startup failures, then `gateway.log`.
- Inspect
  `~/.openclaw-local-test-proxy/logs/shared-browser-proxy.err.log` after proxy
  failures.
- A wizard readiness collision means another client owns the singleton wizard.
  The helper stops its Gateway without cancelling an unknown session.
- Let the helper wait when another startup owns the machine-wide lock.
- Use `<skill-dir>/scripts/openclaw-local-test --status`, then `--stop`, when an expired instance
  remains.
- When channels were requested through an explicit base config, verify the run
  omitted `--no-channels` and inspect channel startup logs.
