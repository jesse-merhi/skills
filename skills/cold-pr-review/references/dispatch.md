# Dispatch

Dispatch a separate reviewer subagent by default. The cold review loses most of
its value if the same agent that implemented or prepared the change also
performs the review in the same context.

Use the harness's subagent mechanism:

- **Codex:** use `spawn_agent` with `agent_type: "cold-reviewer"` and
  `fork_turns: "none"`. A full-history fork inherits the parent's agent type and
  ignores the override. That agent already carries the review checklist, finding
  gates, rating table, and report format, so leave those and any skill file out
  of its brief. Install or refresh the agent with `skill-profiles`.
- **Claude Code:** use the `Task` tool with a code-reviewer or general reviewer
  subagent, and give it the neutral checklist.
- **Other harnesses:** use the closest available isolated reviewer
  agent/workspace, and give it the neutral checklist.

Only fall back to a self-review when the harness truly cannot dispatch a
separate agent. If you must fall back, say so explicitly and start a fresh
review pass after deliberately discarding the implementation rationale.

Give the reviewer only:

- what to review: PR number, file path, or git range
- the base and the frozen review boundary
- a changed-flow summary
- domain-specific checklist topics when the diff needs them
- a neutral review checklist, outside Codex's `cold-reviewer` agent

Do not give it:

- your reasoning or design decisions
- what was already reviewed or fixed
- what issues were found previously
- context about the implementation approach
- whether CI is passing
