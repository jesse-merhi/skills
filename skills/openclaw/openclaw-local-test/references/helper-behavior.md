# Helper Behavior

The helper:

- chooses a free Gateway/browser proxy port pair from `19010` upward
- writes isolated state to `~/.openclaw-local-test`
- rotates previous per-agent session history on each start so stale provider
  replay state cannot poison manual tests. Set
  `OPENCLAW_LOCAL_TEST_KEEP_SESSIONS=1` only when resume behavior is the thing
  being tested.
- mirrors the explicitly provided `--base-config` so Slack and Discord
  credentials/config can follow the test instance when the user chooses that
- normalizes the manual-test default model to
  `atlassian-aigw/gpt-5.5-2026-04-23`
- keeps the source agent configuration unless the helper explicitly rewrites a
  field, so permissions, approvals, tools, and plugin allowlists can affect the
  local test
- forces `tools.exec.host` to `"auto"` so exec auto-review PRs can be tested
  directly
- starts the local Atlassian AIGW launchd service when available
- starts one shared browser-safe localhost proxy daemon and registers a
  per-instance route/port for the Gateway
- serializes startup with a machine-wide lock so concurrent agents do not choose
  the same free-looking port before either process binds it
- verifies the Gateway listener belongs to the Gateway it just started and the
  browser proxy route belongs to the shared proxy daemon before reporting
  success
- checks Gateway and browser-proxy HTTP health independently, then starts a
  typed wizard readiness probe and cancels that exact session in a cleanup trap
  if it remains running; an immediately completed session is already terminal
  and requires no cancellation before the browser URL is reported
- stops the Gateway and removes its proxy route if startup is interrupted after
  the managed processes begin but before the lease watchdog is registered
- leaves the browser closed by default and prints the proxied Control UI URL.
  Use `--open` when the browser should launch automatically.
- writes a local lease file and starts a detached watchdog that auto-stops the
  managed Gateway/proxy after the TTL. The default TTL is `8h`.

The generated config intentionally uses loopback-only, unauthenticated local UI
settings for convenience. Running the helper creates a second local copy of the
selected config under the state directory. Do not expose the port publicly or
paste secrets from the mirrored config into chat.
