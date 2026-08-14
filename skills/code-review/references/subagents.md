# Subagents

Always use subagents for code-review work. At minimum, every review needs a
subagent using `cold-pr-review-until-clean`; do not use `cold-pr-review` for
this skill. Give that subagent the target, base, changed-surface summary, and
the risk checklist from the one-time setup.

Every review subagent must start without coordinator conversation history. In
Codex, set `fork_turns: "none"`; use the equivalent context-free option in
other harnesses. Pass only a self-contained text brief containing the target,
base, changed-surface summary, and the lens it owns. Repository inspection is
allowed and expected; inherited turns are not.

Always add a focused `test-audit` subagent when the PR touches code with nearby
or related tests, or when the PR changes, adds, or deletes tests. Ask it to
check both coverage drift and changed-test usefulness.

Always add a focused `typescript-discipline` subagent when the changed surface
includes TypeScript production code, shared domain types, schemas,
API/client/server contracts, exported helpers, typed React components, or
assertions/`any`/`unknown` boundary handling.

Add other focused subagents with the relevant named skills when useful:

- `pr-rubbish-audit`
- `improve-codebase-architecture`
- `reducing-cognitive-load`
- `frontend-ui-validation`
- `review-animations`

Give subagents neutral prompts: target, base, changed-surface summary, and the
checklist they own. Tracked-finding notices for open Class B findings, generated
fresh per `review-guardrails`, are the one allowed reference to prior findings.
Do not leak desired conclusions or ask for a rubber stamp.

Give cold-review subagents the target, neutral checklist, and tracked-finding
notices generated from currently open consult entries. If an optional decision
log exists, give them its path only with the guard above; after the verdict,
they should append long-form rationale or return the entries if they cannot
write.

If the harness cannot run subagents, say so, continue only as best effort, and
do not call the review clean unless the user accepts that limitation.

After dispatching a review batch, finish useful independent coordinator work.
Once blocked, follow the `wait-efficiently` subagent pattern. Keep the parent
turn active until every required reviewer reaches a terminal state.

Run `monitoring-gh-actions` at the end, after both review phases and local
validation are clean, when PR checks are pending and monitoring is in scope.
That is coordinator work, not a review subagent.
