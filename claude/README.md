# Claude named workers

The normal Claude Code session coordinates the work on Fable 5.1 at high by default; explicit user model and effort choices take precedence. These optional native subagents hold reusable instructions, model and effort settings, domain skill references, boundaries and report expectations.

Select the default in Claude's normal settings or launch a normal main session explicitly:

```sh
claude --model claude-fable-5-1 --effort high
```

Installing skills or these role definitions does not select that main-session model.

| Name | Model | Effort | Assignment |
| --- | --- | --- | --- |
| `implementer` | `claude-fable-5-1` | `high` | An owned code or test change with focused verification |
| `investigator` | `claude-fable-5-1` | `high` | A bounded question answered with current evidence |
| `findings-reviewer` | `claude-fable-5-1` | `high` | Independent inspection and findings only |
| `oracle` | `claude-opus-5-5` | `high` | Optional read-only advice on a bounded unresolved decision |

Ordinary workers and reviewers pin Fable 5.1 at high; only the oracle pins Opus 5.5 at high. These definitions do not change the coordinator's selected model. Set an explicit exception through a supported launcher override or a separate definition; a prompt cannot change pinned settings. Report unsupported models or effort instead of silently substituting.

## Installation

Install matching domain skills through [INSTALL.md](../INSTALL.md). For availability across projects, link the four files from `claude/agents/` into `~/.claude/agents/`. For one project, use its `.claude/agents/`. Survey all destinations first: preserve real files and foreign links, asking before replacing them. Replace only links verified as belonging to this repository or a verified previous clone. Create absent destinations using ordinary `ln -s` without force so concurrent files are preserved. For absent destinations:

```sh
mkdir -p ~/.claude/agents
ln -s /absolute/path/to/skills/claude/agents/implementer.md ~/.claude/agents/implementer.md
ln -s /absolute/path/to/skills/claude/agents/investigator.md ~/.claude/agents/investigator.md
ln -s /absolute/path/to/skills/claude/agents/findings-reviewer.md ~/.claude/agents/findings-reviewer.md
ln -s /absolute/path/to/skills/claude/agents/oracle.md ~/.claude/agents/oracle.md
```

Keep the source checkout available and restart Claude after installation. Do not change the `agent` setting or use `--agent` for the coordinator; those select a custom main agent. This repository change does not install anything into a live session.

Claude supports native Markdown definitions and session-only `--agents` JSON. No separate installer or orchestration skill is needed. See [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) for native discovery and configuration.

## Assignment

Use the `Agent` tool with `subagent_type` equal to the configured name. For example, select `investigator` and supply:

> Objective: explain why an empty search returns all records. Worktree: /work/project; revision: abc123. Scope: search handler and callers. Constraints: read only. Acceptance: identify the reachable cause and cite the relevant lines. Evidence: the request returned HTTP 200 with all records.

The role already supplies the investigation process and report expectations. Delegate useful bounded work on demand. The coordinator keeps sequencing, integration, validation and delivery. These roles are usable beyond the skills that explicitly route to them.

Start `findings-reviewer` fresh with the target, neutral checklist and requested evidence. Omit implementation rationale and earlier findings; do not resume an implementer as a reviewer. Persistent agent memory is not enabled, but Claude can load project instructions and discover skills. This is not the other harness's skill exclusion or memory isolation mechanism. Disclose prior findings in the review context. Tool restrictions are not a filesystem sandbox: Bash remains available for inspection and verification under read-only duties.

Each report supplies one assessment for `code-review`. Its coordinator owns the simplification pass, both independent assessments, confirmed repairs, verification and delivery. Other harnesses must use their own launcher; OpenClaw's spawn API is not Claude's `Agent` tool.

Use `oracle` when an unresolved decision merits optional Opus advice. Supply one bounded question, the revision, relevant evidence, constraints and the decision the coordinator needs to make. The oracle reads evidence and returns advice, trade-offs and uncertainty. It cannot edit, run mutating checks, manage repairs, spawn workers, approve or deliver the change. The coordinator evaluates the advice and retains ownership. Consultation adds no mandatory gate and does not replace either ordinary review assessment. Its tool list permits inspection; read-only duties also cover Bash and external tools.

[Earlier verification](VERIFICATION.md) records previous role settings and exercises. It does not establish live dispatch of the current role definitions.
