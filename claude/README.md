# Claude named workers

The normal Claude Code session coordinates the work on Opus 5.5 at high by default, without an advisor, and with Opus as the default subagent model. Explicit user model and effort choices take precedence. These optional native subagents hold reusable instructions, model and effort settings, domain skill references, boundaries and report expectations.

Select the default in Claude's normal settings or launch a normal main session explicitly:

```sh
CLAUDE_CODE_SUBAGENT_MODEL=claude-opus-5-5 claude --model claude-opus-5-5 --effort high
```

Installing skills or these role definitions does not change live model or advisor settings. Leave `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` unset so role pins and per-invocation model overrides retain their models.

| Name | Model | Effort | Assignment |
| --- | --- | --- | --- |
| `implementer` | `claude-opus-5-5` | `high` | An owned code or test change with focused verification |
| `test-executor` | `claude-haiku-5-5` | `high` | An established validation batch, stopping at the first failure |
| `investigator` | `claude-opus-5-5` | `high` | A bounded question answered with current evidence |
| `findings-reviewer` | `claude-opus-5-5` | `high` | Independent inspection and findings only |
| `Explore` | `claude-haiku-5-5` | `high` | Read-only codebase search, replacing Claude Code's built-in `Explore` |
| `oracle` | `claude-fable-5-2` | `high` | Optional read-only advice on a bounded unresolved decision |

The [Claude policy](../AGENTS.md#named-workers) assigns straightforward tasks to Haiku, well-specified implementation to Sonnet and other work to Opus. Claude Code's [model order](https://code.claude.com/docs/en/sub-agents#choose-a-model) lets a per-invocation `model` override the role and environment defaults. Send codebase searches, including named-definition lookups, to `Explore`. For a bounded question with a checkable answer, invoke `investigator` with `model: "haiku"`; its read-only scope and effort still apply. Use its Opus default for a causal investigation. For well-specified implementation, invoke `implementer` with `model: "sonnet"`. The per-invocation `model` accepts only aliases.

Haiku 5.5 requires Claude Code 2.1.293 or later. Claude Code 2.1.319 prints `[claude-code:unrecognized_model]` for `claude-fable-5-2`, but the API serves it; treat that warning as expected. Check the version and actual launch model and effort. Report unsupported settings instead of silently substituting; a prose request cannot select launch settings.

## Installation

Install matching domain skills through [INSTALL.md](../INSTALL.md). For availability across projects, link the six files from `claude/agents/` into `~/.claude/agents/`. For one project, use its `.claude/agents/`. Survey all destinations first: preserve real files and foreign links, asking before replacing them. Replace only links verified as belonging to this repository or a verified previous clone. Create absent destinations using ordinary `ln -s` without force so concurrent files are preserved. For absent destinations:

```sh
mkdir -p ~/.claude/agents
ln -s /absolute/path/to/skills/claude/agents/implementer.md ~/.claude/agents/implementer.md
ln -s /absolute/path/to/skills/claude/agents/test-executor.md ~/.claude/agents/test-executor.md
ln -s /absolute/path/to/skills/claude/agents/investigator.md ~/.claude/agents/investigator.md
ln -s /absolute/path/to/skills/claude/agents/findings-reviewer.md ~/.claude/agents/findings-reviewer.md
ln -s /absolute/path/to/skills/claude/agents/oracle.md ~/.claude/agents/oracle.md
ln -s /absolute/path/to/skills/claude/agents/Explore.md ~/.claude/agents/Explore.md
```

Keep the source checkout available and restart Claude after installation. Do not change the `agent` setting or use `--agent` for the coordinator; those select a custom main agent. This repository change does not install anything into a live session.

Claude supports native Markdown definitions and session-only `--agents` JSON. No separate installer or orchestration skill is needed. See [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) for native discovery and configuration.

## Assignment

Use the `Agent` tool with `subagent_type` equal to the configured name. For example, select `investigator` and supply:

> Objective: explain why an empty search returns all records. Worktree: /work/project; revision: abc123. Scope: search handler and callers. Constraints: read only. Acceptance: identify the reachable cause and cite the relevant lines. Evidence: the request returned HTTP 200 with all records.

The role already supplies the investigation process and report expectations. Delegate useful bounded work on demand. The coordinator keeps sequencing, integration, validation and delivery. These roles are usable beyond the skills that explicitly route to them.

Start `findings-reviewer` fresh with the target, neutral checklist and requested evidence. Omit implementation rationale and earlier findings; do not resume an implementer as a reviewer. Persistent agent memory is not enabled, but Claude can load project instructions and discover skills. This is not the other harness's skill exclusion or memory isolation mechanism. Disclose prior findings in the review context. Tool restrictions are not a filesystem sandbox: Bash remains available for inspection and verification under read-only duties.

This role can supply the Opus 5.5 member of `code-review`’s council at high. The complete council also needs Fable 5.2, Astra and GPT-6.1 Sol at high through a launcher supporting those models; native Claude agents alone do not meet that selection. Each member covers both standards and correctness. The coordinator owns simplification, the shared code/UI round record and stop decision, confirmed repairs, verification and delivery. Other harnesses must use their own launcher; OpenClaw's spawn API is not Claude's `Agent` tool.

Every call to `Explore`, including Claude's own choice of it for searches, uses this definition. Like the built-in, it starts without CLAUDE.md files. Remove the link to restore the built-in agent.

Use `oracle` when an unresolved decision merits optional Fable advice. Supply one bounded question, the revision, relevant evidence, constraints and the decision the coordinator needs to make. The oracle reads evidence and returns advice, trade-offs and uncertainty. It cannot edit, run mutating checks, manage repairs, spawn workers, approve or deliver the change. The coordinator evaluates the advice and retains ownership. Consultation adds no mandatory gate and does not replace a required council assessment. Its tool list permits inspection; read-only duties also cover Bash and external tools.

## Advisor

Leave Claude Code's [advisor tool](https://code.claude.com/docs/en/advisor) off by default. In Anthropic's [model guide](https://claude.dev/blog/which-claude-model-should-you-build-with/), no tested advisor pairing clearly beat its executor alone; Opus 5.5 with a Fable 5.1 advisor gained 1.7 points for about 2.1 times the cost. Each advisor call also reads the full conversation uncached at the advisor's rates. For a deliberate Fable opinion on one decision, use the read-only `oracle` role.

[Verification](VERIFICATION.md) records role exercises, including live model selection for the current `Explore`, `oracle` and Sonnet `implementer` override. It does not establish effort settings or complex delegation.
