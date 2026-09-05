# Dispatch

Dispatch a separate reviewer subagent by default. The cold review loses most of
its value if the same agent that implemented or prepared the change also
performs the review in the same context.

Use Astra at medium unless the user selects another reviewer. Configure these
settings in the launcher; do not use a role fixed at high effort. In Claude,
use an available isolated Codex reviewer route with a native completion channel.
If that route is unavailable, report the missing capability rather than silently
substituting a cheaper model. The mechanics below remain subject to that selection.

Use the harness's subagent mechanism:

- **Codex:** use `spawn_agent` with a tightly scoped review prompt.
- **Claude Code:** use the `Task` tool with a code-reviewer or general reviewer
  subagent.
- **Other harnesses:** use the closest available isolated reviewer
  agent/workspace.

Only fall back to a self-review when the harness truly cannot dispatch a
separate agent. If you must fall back, say so explicitly and start a fresh
review pass after deliberately discarding the implementation rationale.

Give the reviewer only:

- what to review: PR number, file path, or git range
- a neutral review checklist

Do not give it:

- your reasoning or design decisions
- what was already reviewed or fixed
- what issues were found previously
- context about the implementation approach
- whether CI is passing
