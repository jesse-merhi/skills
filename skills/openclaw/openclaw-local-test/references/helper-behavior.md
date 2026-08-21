# Helper behavior

The helper:

- inspects both native clients and reports only whether each login is usable,
  the auth class, the route class, and the selected model
- prefers Codex in `--runtime auto` when both native clients are usable; an
  explicit `--runtime claude` or `--runtime codex` wins
- uses Codex with the native app-server's user-home scope, so Codex remains the
  source of truth for its API-key or ChatGPT login, `config.toml`, selected
  model provider, custom endpoint/proxy settings, plugins, and thread store
- uses Claude through OpenClaw's bundled `claude-cli` runtime, so the installed
  Claude process remains the source of truth for subscription/API-key auth and
  user settings
- writes no Codex or Claude credential value into the generated OpenClaw config
- starts from an empty OpenClaw config unless `--base-config` is explicit; the
  safe Gateway, workspace, model-runtime, and tool-host overlays always win
- chooses a free Gateway/browser proxy port pair from `19010` upward
- writes isolated OpenClaw state to `~/.openclaw-local-test`
- rotates previous per-agent session history on each start; set
  `OPENCLAW_LOCAL_TEST_KEEP_SESSIONS=1` only when resume behavior is under test
- forces `tools.exec.host` to `"auto"`
- starts one shared browser-safe localhost proxy and registers a per-instance
  route
- serializes startup with a machine-wide lock
- verifies process ownership, Gateway health, browser-proxy health, and a typed
  wizard start/status/cancel lifecycle before reporting success
- stops managed processes after interrupted startup
- leaves the browser closed by default and prints the proxied Control UI URL
- starts an eight-hour detached auto-stop lease unless `--no-ttl` is explicit

The generated config intentionally uses loopback-only, unauthenticated local UI
settings. An explicit base config creates a second local copy under the state
directory and may contain its existing secrets. Keep the state directory
private, do not expose the port, and never paste the raw config into chat.
