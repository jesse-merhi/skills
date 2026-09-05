# Subagents

Use in-chat subagents for Phase 2 cold review and focused lenses. Never run
Phase 1 native review as a subagent: it belongs in an external harness-native
session whose task or session ID the coordinator records and archives after
collecting the result. At minimum, every review needs a Phase 2 subagent using
`cold-pr-review-until-clean`; do not use `cold-pr-review` for this skill. Give
that subagent the target, base, changed-flow summary, and the risk checklist
from the one-time setup.

Use Astra at medium for review workers, including those launched from Claude.
Set both in the launcher. If a findings-only preset fixes high effort, use a
fresh configurable worker with the same findings-only assignment instead.
Never downgrade review to the mechanical Luna worker or silently inherit a
different model. Honor an explicit user-selected reviewer.

Every review subagent must start without coordinator conversation history. In
Codex, set `fork_turns: "none"`; use the equivalent context-free option in
other harnesses. Pass only a self-contained text brief containing the target,
base, changed-flow summary, and the lens it owns. Repository inspection is
allowed and expected; inherited turns are not.

Always add a focused `test-audit` subagent when the PR changes production
behavior or creates, changes, or deletes tests or test infrastructure. Ask it
to check coverage drift, changed-test usefulness, portfolio ownership,
proof-level placement, and deletion safety.

Always add a focused `typescript-discipline` subagent when the changed code
includes TypeScript production code, shared domain types, schemas,
API/client/server contracts, exported helpers, typed React components, or
assertions/`any`/`unknown` boundary handling.

Add other focused subagents with the relevant named skills when useful:

- `pr-rubbish-audit`
- `improve-codebase-architecture`
- `reducing-cognitive-load`
- `frontend-ui-validation`
- `design` in motion-review mode

Give subagents neutral prompts: target, base, changed-flow summary, and the
checklist they own. State the frozen review boundary: inspect the changed diff
and the runtime flows it directly changes; read unchanged files only to
understand those flows. Every finding must identify the changed line or contract
that causes, exposes, or worsens the problem. Do not reveal prior findings,
desired conclusions, or a requested verdict.

Before assigning general, discovery, or cold-review work, run `coverage-status --json`
with the active review identity. Assign stale and unreviewed files first, then
files reviewed once, then files reviewed twice. Give the subagent its assigned
files or flows, not the coverage counts or earlier verdicts. Coverage changes
work order; it does not prohibit reading lower-priority files or shared
contracts. Preserve each assigned file's observed `changeId` for the final
attestation.

At the end of a general, discovery, or cold review, the subagent must make one `coverage-record`
call for changed files whose diff and relevant behavior it actually assessed.
Use one stable review ID for that subagent invocation. Do not record files that
were merely listed, opened for context, or checked only through a narrow lens.
Pass the observed `changeId` paired with each file; if any file changed during
review, the command rejects the batch instead of crediting unseen content.
If the subagent cannot write the external review database, it must return the
exact file list, observed change IDs, and review ID for the coordinator to
record in one batch.

Give cold-review subagents only the target and neutral checklist. After the
verdict, match candidates against the findings registry and open consult queue.
If an optional decision log exists, give them its path only after the verdict
for long-form rationale, or have them return the entries if they cannot write.

If the harness cannot run subagents, say so, continue only as best effort,
and do not call the review clean unless the user accepts that limitation.

After dispatching a review batch, finish useful independent coordinator work.
Once blocked in Codex, follow the `wait-efficiently` subagent pattern with an
event-driven 15-minute wait. It wakes as soon as a reviewer sends an update or
returns. After a
non-terminal update or first timeout, wait again without listing agent status.
Inspect only after two consecutive timeouts or an explicit error. Keep the
parent turn active until every required reviewer reaches a terminal state.

Use `wait-efficiently`'s GitHub Actions mode at the end, after both review phases
and local validation are clean, when PR checks are pending and monitoring is in
scope. That skill owns the optional Luna worker for this mechanical phase;
review judgment and the final gate remain with the coordinator.
