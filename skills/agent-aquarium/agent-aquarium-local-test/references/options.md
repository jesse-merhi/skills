# Options

Use a specific checkout or worktree:

```bash
agent-aquarium-local-test --repo ~/repos/agent-aquarium
```

Import a compact portable snapshot of current local Aquarium state:

```bash
agent-aquarium-local-test --with-aquarium-snapshot
```

Refresh requested snapshots from their current local sources:

```bash
agent-aquarium-local-test --with-aquarium-snapshot --refresh
```

Reuse a requested cached snapshot or explicitly start empty:

```bash
agent-aquarium-local-test --with-aquarium-snapshot --no-refresh
agent-aquarium-local-test --empty
```

`--no-refresh` rejects a cache created with different snapshot sources, modes,
or limits instead of silently starting with mismatched state.

Add bounded provider session snapshots for discovery or native archive testing:

```bash
agent-aquarium-local-test --with-aquarium-snapshot --with-provider-snapshot
```

Tune the bounded provider snapshot. Limits apply separately to Codex and
Claude, newest files first:

```bash
agent-aquarium-local-test --with-provider-snapshot \
  --provider-max-files 150 \
  --provider-max-mb 256
```

Include Codex's global metadata databases only when reproducing app-server
inventory behavior. Large catalogues can make startup substantially slower:

```bash
agent-aquarium-local-test --with-provider-snapshot --include-codex-state-db
```

Override snapshot sources when testing a non-default local installation:

```bash
agent-aquarium-local-test \
  --source-aquarium-home /absolute/aquarium-home \
  --source-codex-home /absolute/codex-home \
  --source-claude-config-dir /absolute/claude-config
```

Choose a port or open a browser:

```bash
agent-aquarium-local-test --port 4242
agent-aquarium-local-test --open
agent-aquarium-local-test --open --browser "Google Chrome"
```

Control dependency installation and lease duration:

```bash
agent-aquarium-local-test --skip-install
agent-aquarium-local-test --ttl 2h
agent-aquarium-local-test --no-ttl
```

Inspect the plan or managed instance:

```bash
agent-aquarium-local-test --dry-run
agent-aquarium-local-test --status
agent-aquarium-local-test --stop
```

Use a distinct state root to run another managed instance:

```bash
agent-aquarium-local-test --state-dir ~/.agent-aquarium-local-test-feature-b
```
