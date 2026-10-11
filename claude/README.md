# Claude named workers

The normal Claude Code session coordinates the work on Opus 5.5 at high by default, with Fable as advisor and Opus as the default subagent model. Explicit user model and effort choices take precedence. These optional native subagents hold reusable instructions, model and effort settings, domain skill references, boundaries and report expectations.

Select the default in Claude's normal settings or launch a normal main session explicitly:

```sh
CLAUDE_CODE_SUBAGENT_MODEL=claude-opus-5-5 claude --model claude-opus-5-5 --effort high --advisor fable
```

Installing skills or these role definitions does not change live model or advisor settings. Leave `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` unset so explicit Haiku assignments and the Fable oracle retain their models.

| Name | Model | Effort | Assignment |
| --- | --- | --- | --- |
| `implementer` | `claude-opus-5-5` | `high` | An owned code or test change with focused verification |
| `test-executor` | `claude-haiku-5-5` | `high` | An established validation batch, stopping at the first failure |
| `investigator` | `claude-opus-5-5` | `high` | A bounded question answered with current evidence |
| `findings-reviewer` | `claude-opus-5-5` | `high` | Independent inspection and findings only |
| `oracle` | `claude-fable-5-1` | `high` | Optional read-only advice on a bounded unresolved decision |

The [Claude policy](../AGENTS.md#named-workers) assigns straightforward tasks to Haiku and defaults other work to Opus. Claude Code's [model order](https://code.claude.com/docs/en/sub-agents#choose-a-model) lets a per-invocation `model` override the role and environment defaults. For a named-definition lookup, invoke `investigator` with `model: "claude-haiku-5-5"` and `effort: "high"`; its read-only scope still applies. Use its Opus default for a causal investigation.

Haiku 5.5 requires Claude Code 2.1.293 or later. Check the version and actual launch model and effort. Report unsupported settings instead of silently substituting; a prose request cannot select launch settings.

## Installation

Install matching domain skills through [INSTALL.md](../INSTALL.md). For availability across projects, link the five files from `claude/agents/` into `~/.claude/agents/`. For one project, use its `.claude/agents/`. Survey all destinations first: preserve real files and foreign links, asking before replacing them. Replace only links verified as belonging to this repository or a verified previous clone. Create absent destinations using ordinary `ln -s` without force so concurrent files are preserved. For absent destinations:

```sh
mkdir -p ~/.claude/agents
ln -s /absolute/path/to/skills/claude/agents/implementer.md ~/.claude/agents/implementer.md
ln -s /absolute/path/to/skills/claude/agents/test-executor.md ~/.claude/agents/test-executor.md
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

Use `oracle` when an unresolved decision merits optional Fable advice. Supply one bounded question, the revision, relevant evidence, constraints and the decision the coordinator needs to make. The oracle reads evidence and returns advice, trade-offs and uncertainty. It cannot edit, run mutating checks, manage repairs, spawn workers, approve or deliver the change. The coordinator evaluates the advice and retains ownership. Consultation adds no mandatory gate and does not replace either ordinary review assessment. Its tool list permits inspection; read-only duties also cover Bash and external tools.

## Advisor

Fable is the chosen advisor for the Opus coordinator. Enable Claude Code's [advisor tool](https://code.claude.com/docs/en/advisor) with `/advisor fable`, the `advisorModel` setting or `claude --advisor fable`. Claude decides when advice would help; each call reads the full conversation uncached at Fable rates. Subagents inherit the advisor when their model accepts the pairing. It requires the Anthropic API and Fable access, and some plans bill Fable to usage credits. When unavailable, use the optional read-only `oracle` role.

[Earlier verification](VERIFICATION.md) records previous role settings and exercises. It does not establish live dispatch of the current role definitions.
