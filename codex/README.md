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
| Coordinator | GPT-6 Astra | xhigh |
| `implementer` — cohesive execution owner | GPT-5.6 Sol | high |
| `test_executor` — established validation execution | GPT-5.6 Luna | max |
| `investigator` — bounded investigation and research | GPT-5.6 Luna | max |
| `findings_reviewer` — independent findings only | GPT-6 Astra | xhigh |
| Unnamed child | GPT-5.6 Sol | high |

At most four child threads run concurrently. The profile does not launch a fixed agent tree. Assign one `implementer` as execution owner for a cohesive change; it owns integration, verification, review-record mechanics, commits and already-authorized delivery under `AGENTS.md`. The main coordinator plans, communicates with the user and judges code review. Explicit spawn arguments override unnamed-child defaults, but named roles retain their pinned model and effort. For an approved exception, use an unnamed child with explicit settings or a separately configured role.

For established validation, `writing-good-tests` selects `test_executor` and defines the batch, receipt and failure handoff. It also describes the explicit-settings fallback for launchers without the named role.

The existing workflow owners select these roles: `just-do-it` assigns cohesive execution, `grilling` delegates factual questions, and `code-review` delegates repair execution and its independent phase. The execution owner keeps sequencing, integration, shared verification and authorized delivery. A worker assigned an until-clean workflow owns that workflow's execution; a findings-only reviewer remains read-only.

On a launcher exposing these roles, set `agent_type="investigator"` or `agent_type="implementer"` on `spawn_agent`. Supply task-specific context, for example:

```text
Objective: establish why empty exports fail.
Worktree/revision: /work/export-fix at <commit>.
Scope: export entry point and its caller; read-only investigation.
Constraints: use local fixtures; no production access.
Acceptance: identify the reachable trigger and expected versus observed result.
Evidence: <local reproduction output and relevant source paths>.
```

The role definition supplies reusable behavior, skill references, boundaries and expected outputs. A task name alone does not select a role. Report missing roles instead of rebuilding their prompts or changing live settings. Reassign missing execution work to a supported owner; the main coordinator may continue planning and review. For a user-selected model exception, use the explicit settings route above rather than pretending a pinned role changed.

Use `findings_reviewer` only for an authorized findings-only review in fresh context, never for a delegated until-clean workflow. Its regular file is `orchestration/findings-reviewer.toml`; the standalone `findings-reviewer.config.toml` profile links to that same definition, including its skill exclusions and memory settings. The named-role loader rejects a file symlink as its final path component, so role paths go through the linked directory. This does not replace the native and independent phases required by `code-review`.

## What installation changes

The installer creates three links under `CODEX_HOME` (default `~/.codex`): the orchestration profile, the role directory and the existing findings-reviewer profile. It leaves `config.toml`, `agents/`, skills, credentials and permissions alone. The work roles are registered by the selected profile, not globally discovered from `agents/`.

Use `--root <directory>` to install into a different configuration root. Launch Codex with that same `CODEX_HOME`. Repeating installation is a no-op. To move from a verified earlier clone, pass `--previous-source <old-repository-root>`. For an existing previous clone, aliases resolve to its canonical path. If it has been removed, pass the canonical repository path recorded in the installed link target. Other collisions stop installation before links change. See `./install-codex-profiles --help` for options.

The role prompts describe assignments, not filesystem isolation. They inherit the session's permissions. The coordinator's existing developer instructions and global `AGENTS.md` remain in place; install the shared instructions through [INSTALL.md](../INSTALL.md) if they are not already present.

## Harness support

These are native Codex CLI profile and role files. See the official [profile documentation](https://learn.chatgpt.com/docs/config-file/config-advanced#profiles) and [subagent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents). Project and command-line overrides can supersede a profile.

Follow [wait-efficiently](../skills/wait-efficiently/SKILL.md#required-agent-results) for worker reporting and owner waits. These profiles configure prompts and models; they do not suspend the coordinator or change active model settings.

The inspected CLI 0.154.0 exposes `turn/completed` and `thread/status/changed`. Desktop `wait_agent` wakes for mailbox messages and completion; `wait_threads` filters commentary and retains result cursors. Neither tool contract guarantees that child completion wakes an ended parent turn.

Full suspension needs host support to retain worker handles and evidence, show routine progress without model generation, and wake the coordinator for completion, failure, decisions or user input. It also needs an exemption from periodic commentary and wait timeouts. These prompts cannot provide that behavior.

OpenClaw's in-chat spawn API does not expose a profile or named-role selector in this environment. Installing these files does not configure those children or give them the reviewer filter. Their launcher must select the model and effort explicitly under the shared policy. No live OpenClaw settings are changed by this installer.

The profile structure was inspired by [donvito/codex-astra-luna-orchestrator](https://github.com/donvito/codex-astra-luna-orchestrator). The settings and prompts here implement this repository's policy; no upstream installer or skill is copied.
