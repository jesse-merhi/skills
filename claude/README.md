# Claude named workers

The normal Claude Code session coordinates the work. These optional native subagents hold reusable instructions, model and effort settings, domain skill references, boundaries and report expectations.

| Name | Model | Effort | Assignment |
| --- | --- | --- | --- |
| `implementer` | `claude-opus-5-5` | `high` | Substantive implementation, design choices or difficult debugging |
| `bounded-implementer` | `claude-sonnet-5-5` | `high` | A small change with a clear contract and existing validation |
| `investigator` | `claude-sonnet-5-5` | `medium` | A bounded question answered with current evidence |
| `findings-reviewer` | `claude-opus-5-5` | `xhigh` | Independent inspection and findings only |

Use Opus 5.5 at xhigh for the normal coordinating session when selecting its model and effort. `implementer` owns substantive changes, including ambiguous requirements, design choices, difficult debugging and work across permission, concurrency, lifecycle or component boundaries. Choose `bounded-implementer` only for a clear, small assignment with existing validation. If its scope grows, return the evidence for Opus reassignment. Preserve explicit user model or effort choices; report unsupported settings instead of silently substituting. Worker definitions do not change the coordinator's selected model.

Installed skills are one profile view selected for the harness root at installation. Launching a worker with another model does not switch that view. Keep shared prompts usable by both Opus and Sonnet; use separate configuration roots if concurrent sessions need distinct installed profiles.

## Installation

Install matching domain skills through [INSTALL.md](../INSTALL.md). For availability across projects, link the four files from `claude/agents/` into `~/.claude/agents/`. For one project, use its `.claude/agents/`. Survey all destinations first: preserve real files and foreign links, asking before replacing them. Replace only links verified as belonging to this repository or a verified previous clone. Create absent destinations using ordinary `ln -s` without force so concurrent files are preserved. For absent destinations:

```sh
mkdir -p ~/.claude/agents
ln -s /absolute/path/to/skills/claude/agents/implementer.md ~/.claude/agents/implementer.md
ln -s /absolute/path/to/skills/claude/agents/bounded-implementer.md ~/.claude/agents/bounded-implementer.md
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

Each report supplies one assessment for `code-review`. Its coordinator owns the simplification pass, both independent assessments, confirmed repairs, verification and delivery. Other harnesses must use their own launcher; OpenClaw's spawn API is not Claude's `Agent` tool.
