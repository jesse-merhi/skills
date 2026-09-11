# Codex orchestration

Install from a durable clone after `bun ci`, then select the profile for a new session:

```sh
./install-codex-profiles --dry-run
./install-codex-profiles
codex --profile orchestration
```

The profile implements the [shared model policy](../AGENTS.md#model-turns):

| Role | Model | Reasoning |
| --- | --- | --- |
| Coordinator | GPT-6 Astra | medium |
| `implementer` — implementation and tests | GPT-5.6 Sol | high |
| `investigator` — bounded investigation and research | GPT-5.6 Luna | max |
| `findings_reviewer` — independent findings only | GPT-6 Astra | xhigh |
| Unnamed child | GPT-5.6 Sol | high |

At most four child threads run concurrently. Delegate only useful independent work; the profile does not launch a fixed agent tree. The coordinator owns integration and verification under `AGENTS.md`. Explicit spawn arguments override unnamed-child defaults, but named roles retain their pinned model and effort. For an approved exception, use an unnamed child with explicit settings or a separately configured role.

For example:

```text
Investigate the export failure with investigator. Once the cause is established,
assign the bounded fix and tests to implementer, then integrate and verify it.
```

Use `findings_reviewer` only for an authorized findings-only review in fresh context, never for a delegated until-clean workflow. It reuses `findings-reviewer.config.toml`, including its skill exclusions and memory settings. This does not replace the native and independent phases required by `code-review`.

## What installation changes

The installer creates three links under `CODEX_HOME` (default `~/.codex`): the orchestration profile, the role directory and the existing findings-reviewer profile. It leaves `config.toml`, `agents/`, skills, credentials and permissions alone. The work roles are registered by the selected profile, not globally discovered from `agents/`.

Use `--root <directory>` to install into a different configuration root. Launch Codex with that same `CODEX_HOME`. Repeating installation is a no-op. To move from a verified earlier clone, pass `--previous-source <old-repository-root>`. Other collisions stop installation before links change. See `./install-codex-profiles --help` for options.

The role prompts describe assignments, not filesystem isolation. They inherit the session's permissions. The coordinator's existing developer instructions and global `AGENTS.md` remain in place; install the shared instructions through [INSTALL.md](../INSTALL.md) if they are not already present.

## Harness support

These are native Codex CLI profile and role files. See the official [profile documentation](https://learn.chatgpt.com/docs/config-file/config-advanced#profiles) and [subagent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents). Project and command-line overrides can supersede a profile.

OpenClaw's in-chat spawn API does not expose a profile or named-role selector in this environment. Installing these files does not configure those children or give them the reviewer filter. Their launcher must select the model and effort explicitly under the shared policy. No live OpenClaw settings are changed by this installer.

The profile structure was inspired by [donvito/codex-astra-luna-orchestrator](https://github.com/donvito/codex-astra-luna-orchestrator). The settings and prompts here implement this repository's policy; no upstream installer or skill is copied.
