# Subagent dispatch

Use a fresh subagent for every cold-review pass whenever the harness can
spawn one. The loop is designed to fight implementer anchoring bias; a
self-review inside the implementation context does not provide the same signal.

- In Codex, use `spawn_agent` with `agent_type: "cold-reviewer"` and
  `fork_turns: "none"`. Never inherit the coordinator's turns: a full-history
  fork also inherits the parent's agent type and ignores the override. That
  agent already carries the review checklist, finding gates, rating table, and
  report format; install or refresh it with `skill-profiles`.
- In Claude Code, use the `Task` tool with a code-reviewer or general reviewer
  subagent.
- In other harnesses, use the closest isolated reviewer agent/workspace.

Only fall back to self-review when the harness truly has no subagent or
isolated reviewer mechanism. If you fall back, state that explicitly and treat
the pass as lower-confidence in the final report.

Isolation is about conversation history, not repository access. The reviewer
may read unchanged files to understand runtime flows changed by the target, but
must not audit them as independent targets. Give it facts as plain text: target,
base, frozen review boundary, changed-flow summary, and domain-specific
checklist topics. Do not fork parent turns and expect the reviewer to ignore
them.

After dispatch, finish useful independent coordinator work. Once the result is
required, follow the `wait-efficiently` subagent pattern. Keep the parent turn
active until the reviewer reaches a terminal state.

For Codex's `cold-reviewer` agent, which already owns the lenses, gates, and
report format:

```text
Review <PR #<number> | the changes in git range `<base>...HEAD`> in this
repository. Run <`gh pr view <number>` and `gh pr diff <number>` |
`git diff <base>...HEAD`> to see the change. Base: <base>.

Review the changed diff and the runtime flows it directly changes. Read
unchanged files only to understand those flows; do not audit them as
independent targets.

Changed flows: <the flows, entrypoints, contracts, and side effects the
coordinator already mapped>.

Also cover: <domain-specific topics, such as security-sensitive flows, UI
states to inspect, migration safety, or concurrency concerns>.
```

For a Claude Code or other-harness reviewer, which needs the lenses spelled
out:

```text
Review <PR #<number> | the changes in git range `<base>...HEAD`> in this
repository. Run <`gh pr view <number>` and `gh pr diff <number>` |
`git diff <base>...HEAD`> to understand what it does. Review the changed diff
and the runtime flows it directly changes. Read unchanged files only to
understand those flows; do not audit them as independent targets. First map the
changed flows, entrypoints, contracts, side effects, and validation targets.
Check for unrelated diff rubbish, architecture issues, cognitive load, and React
state ownership issues.
Check TypeScript type boundaries, API/client contracts, schemas, casts,
`any`, `unknown`, and ts-ignore usage when TypeScript changed. Apply security
and UI lenses when the diff touches those areas. Report only concrete
actionable findings. Every finding must identify the changed line or contract
that causes, exposes, or worsens the problem. Exclude pre-existing improvements
and unrelated defects. Report every distinct actionable finding in this pass,
ordered by severity. Return failed candidates separately under `Rejected
candidates`, with a stable fingerprint, failed gate, and one-sentence evidence
rationale; they are audit records, not findings or suggestions. Before
returning, sweep the changed flows again for
distinct failure modes you may have missed, then give a merge verdict.
```

You may add domain-specific checklist items, such as security-sensitive flows,
UI states to inspect, migration safety, or concurrency concerns. Do not include
prior findings. After the reviewer returns, the coordinator matches candidates
against the findings database and open consult queue.

Do not include:

- Any other prior reviewer findings
- Fixes already attempted
- Design rationale
- "CI is passing" or similar confidence signals
- A desired verdict
- Results from earlier `code-review` passes
- Skill files or checklist text for the Codex `cold-reviewer` agent, which
  already has them
