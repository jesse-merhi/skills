# Claude named workers

The normal Claude Code session coordinates the work. These optional native subagents hold reusable instructions, model and effort settings, domain skill references, boundaries and report expectations.

| Name | Model | Effort | Assignment |
| --- | --- | --- | --- |
| `implementer` | `fable` | `high` | An owned code or test change with focused verification |
| `investigator` | `fable` | `medium` | A bounded question answered with current evidence |
| `findings-reviewer` | `claude-opus-5-5` | `xhigh` | Independent inspection and findings only |

The Fable alias selects the runtime's corresponding model. The reviewer pins Opus 5.5 explicitly, so a parent using an older Opus cannot pass that version through the `opus` alias. Neither setting changes the coordinator's selected model. Report unsupported models or effort instead of silently substituting.

## Installation

Install matching domain skills through [INSTALL.md](../INSTALL.md). For availability across projects, link the three files from `claude/agents/` into `~/.claude/agents/`. For one project, use its `.claude/agents/`. Survey all destinations first: preserve real files and foreign links, asking before replacing them. Replace only links verified as belonging to this repository or a verified previous clone. Create absent destinations using ordinary `ln -s` without force so concurrent files are preserved. For absent destinations:

```sh
mkdir -p ~/.claude/agents
ln -s /absolute/path/to/skills/claude/agents/implementer.md ~/.claude/agents/implementer.md
ln -s /absolute/path/to/skills/claude/agents/investigator.md ~/.claude/agents/investigator.md
ln -s /absolute/path/to/skills/claude/agents/findings-reviewer.md ~/.claude/agents/findings-reviewer.md
```

Keep the source checkout available and restart Claude after installation. Do not change the `agent` setting or use `--agent` for the coordinator; those select a custom main agent. This repository change does not install anything into a live session.

Claude supports native Markdown definitions and session-only `--agents` JSON. No separate installer or orchestration skill is needed. See [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) for native discovery and configuration.

## Assignment

Use the `Agent` tool with `subagent_type` equal to the configured name. For example, select `investigator` and supply:

> Objective: explain why an empty search returns all records. Worktree: /work/project; revision: abc123. Scope: search handler and callers. Constraints: read only. Acceptance: identify the reachable cause and cite the relevant lines. Evidence: the request returned HTTP 200 with all records.

The role already supplies the investigation process and report expectations. Delegate useful bounded work on demand. The coordinator keeps sequencing, integration, validation and delivery. These roles are usable beyond the skills that explicitly route to them.

Start `findings-reviewer` fresh with the target, neutral checklist and requested evidence. Omit implementation rationale and earlier findings; do not resume an implementer as a reviewer. Persistent agent memory is not enabled, but Claude can load project instructions and discover skills. This is not the other harness's skill exclusion or memory isolation mechanism. Disclose prior findings in the review context. Tool restrictions are not a filesystem sandbox: Bash remains available for inspection and verification under read-only duties.

The report does not complete `code-review`: its coordinator still owns the native phase, registry, repairs, reruns and delivery gates. Other harnesses must use their own launcher; OpenClaw's spawn API is not Claude's `Agent` tool.
