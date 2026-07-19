# Subagent Dispatch

Use a fresh subagent for every cold-review pass whenever the harness can spawn
one. The loop is designed to fight implementer anchoring bias; a self-review
inside the implementation context does not provide the same signal.

- In Codex, use `spawn_agent` with `fork_turns: "none"` and a self-contained,
  tightly scoped review prompt. Never inherit the coordinator's turns.
- In Claude Code, use the `Task` tool with a code-reviewer or general reviewer
  subagent.
- In other harnesses, use the closest isolated reviewer agent/workspace.

Only fall back to self-review when the harness truly has no subagent or isolated
reviewer mechanism. If you fall back, state that explicitly and treat the pass
as lower-confidence in the final report.

Use the `cold-pr-review` skill's pattern: dispatch an isolated reviewer with no
implementation context. In Codex, use `spawn_agent`; in Claude Code, use `Task`;
in other harnesses, use the closest isolated reviewer mechanism available.

Isolation is about conversation history, not repository access. The reviewer
may inspect the target diff and any repository files it decides are relevant.
Give it facts as plain text: target, base, scope, and a neutral checklist. Do
not fork parent turns and expect the reviewer to ignore them.

For PRs:

```text
Review PR #<number> on this repository. Run `gh pr view <number>` and
`gh pr diff <number>` to understand what it does. Read any files you
need for context. First map the changed flows, entrypoints, contracts,
side effects, and validation targets. Check for unrelated diff rubbish,
architecture issues, cognitive load, and React state ownership issues.
Check TypeScript type boundaries, API/client contracts, schemas, casts,
`any`, `unknown`, and ts-ignore usage when TypeScript changed. Apply security
and UI lenses when the diff touches those surfaces. Report only concrete
actionable findings tied to changed code or contracts. Report every distinct
actionable finding in this pass, ordered by severity. Before returning, sweep
the target again for independent defects in other files or failure modes that
you may have stopped checking after an earlier finding, then give a merge
verdict.
```

For local branches or diffs:

```text
Review the changes in git range `<base>...HEAD` in this repository.
Read any files you need for context. First map the changed flows,
entrypoints, contracts, side effects, and validation targets. Check for
unrelated diff rubbish, architecture issues, cognitive load, and React
state ownership issues. Check TypeScript type boundaries, API/client
contracts, schemas, casts, `any`, `unknown`, and ts-ignore usage when
TypeScript changed. Apply security and UI lenses when the diff touches those
surfaces. Report only concrete actionable findings tied to changed code or
contracts. Report every distinct actionable finding in this pass, ordered by
severity. Before returning, sweep the target again for independent defects in
other files or failure modes that you may have stopped checking after an
earlier finding, then give a merge verdict.
```

You may add domain-specific checklist items, such as security-sensitive flows,
UI states to inspect, migration safety, or concurrency concerns. You may also
append tracked-finding notices for open Class B findings, generated fresh from
the findings database per `review-guardrails` — that is the only prior-finding
content allowed.

Do not include:

- Any other prior reviewer findings
- Fixes already attempted
- Design rationale
- "CI is passing" or similar confidence signals
- A desired verdict
- Results from earlier `code-review` passes
