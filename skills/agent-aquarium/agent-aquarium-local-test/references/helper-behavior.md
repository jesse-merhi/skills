# Helper Behavior

The helper:

- runs the requested Agent Aquarium checkout/worktree with its own dependencies
- defaults to `~/.agent-aquarium-local-test` for snapshots, runtime state, logs,
  process IDs, and lease metadata
- marks and permission-locks its managed state root, and refuses to reuse a
  non-empty directory it does not own
- starts with empty isolated state unless an Aquarium or provider snapshot is
  explicitly requested
- refreshes requested snapshots older than 24 hours unless refresh behavior is
  overridden, and refreshes whenever cached sources, modes, or limits differ
- uses SQLite's backup API to make a consistent temporary copy of the live
  Aquarium database, then stores Aquarium's privacy-preserving portable export
  instead of retaining the multi-gigabyte database copy
- optionally copies the newest Codex session logs and archived sessions within
  explicit file-count and byte budgets while excluding `auth.json`,
  configuration, hooks, skills, and other credential or execution settings
- optionally copies the newest Claude project transcripts within the same
  explicit budgets while excluding credentials, settings, hooks, plugins, and
  account state; copied transcript files are readable only by their owner
- includes consistent Codex global metadata databases only when
  `--include-codex-state-db` is explicitly requested, because a large global
  catalogue can materially delay app-server discovery
- restores each cached snapshot into a fresh runtime directory before startup,
  so archive and queue mutations never modify the cached snapshot or source
- sets isolated `AQUARIUM_HOME`, `DATABASE_URL`, `CODEX_HOME`,
  `CLAUDE_CONFIG_DIR`, `CLAUDE_PROJECTS_ROOT`, provider-state, XDG, temporary,
  and tmux paths
- unsets common provider API keys and telemetry exporters for the managed app
- binds to `127.0.0.1`, disables remote access, and removes owner-token input
- starts with a short provider refresh interval for manual validation
- installs frozen pnpm dependencies when the worktree has no installed modules,
  unless `--skip-install` is used
- uses the active Node 24 runtime or resolves the checkout's `.node-version`
  through `fnm` when another Node major is active
- writes app/supervisor logs under the managed state directory
- runs the app under a process supervisor that terminates the complete managed
  process tree after an eight-hour lease unless `--no-ttl` is used

Snapshots can contain local conversation text and Aquarium metadata. They stay
on this machine and must not be committed or pasted into chat.
