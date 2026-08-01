# Independent Luna Task Lifecycle

An independent Luna task is a full Codex task created through the app task
tools. It runs outside the native subagent tree. The Sol or Terra agent that
creates it owns its entire lifecycle.

## 1. Prepare

1. Confirm the user has authorized this delegated workflow and the current
   surface exposes project listing, task creation, waiting, messaging, and
   archival tools.
2. Confirm the assignment passes the Luna cutoff in `model-routing.md`.
3. Prepare the concise opinionated brief from `worker-contract.md`.
4. Choose a committed starting branch that contains every dependency the
   worker needs. Use a working-tree snapshot only when uncommitted state is
   essential and the snapshot cannot capture unrelated user changes.

If these conditions are not met, use Terra when the work needs its continuing
judgment or native coordination; otherwise the current owner keeps the work.

## 2. Create

1. List projects and select the matching saved project.
2. For a Git repository, create an isolated worktree task. Avoid a local
   same-directory task that can race the parent workspace.
3. Explicitly select `gpt-5.6-luna` with `max` reasoning.
4. Title the task `luna: <bounded outcome>`.
5. Include the complete opinionated brief and consequential decision gates in
   the initial prompt.
6. Record the returned task ID, host ID, title, scope, and starting branch in a
   small parent-side ledger.

If Luna or task creation is unavailable, record the fallback and continue with
Terra when its routing criteria fit, or with the current owner otherwise. Do
not build a replacement MCP server during the implementation task.

## 3. Wait and Steer

- Use the event-driven task-wait primitive with the longest bounded timeout the
  task API supports. For native Terra workers this is
  `wait_agent({timeout_ms: 3600000})`. Task completion or a request for
  attention wakes the creator immediately; a timeout is a recovery boundary
  rather than a progress interval.
- On a timeout without new evidence, inspect the latest task snapshot once to
  diagnose a stall, missed event, or failure. Resume the event wait when the
  task is healthy.
- Treat waiting as supervision, not abandonment. Have Luna request attention
  with evidence at the contract's named decision gates; do not poll routine
  commentary or deterministic progress.
- When the task asks for a decision, supply it when it is inside the creator's
  authority. A Terra creator escalates product or architecture decisions to
  Sol.
- Steer as soon as evidence shows a mistaken assumption, scope drift, repeated
  failure, or avoidable detour. Give the worker the diagnosis, preferred
  approach, supporting repository evidence, and unchanged acceptance boundary.
- Require Luna to report before materially changing its approach. A Terra
  creator surfaces consequential pivots and repeated failures to Sol; Sol may
  provide stronger guidance directly or through Terra.
- Send corrections to the same task so it retains context. Include the failing
  command, observed output, expected behavior, and permitted scope.
- Require the task to return one scoped commit. Treat the parent task's pull
  request as final delivery.

## 4. Inspect and Integrate

1. Inspect the returned commit and changed paths before integrating it.
2. Reject unrelated edits, broad formatting churn, dependency changes, or
   ownership violations.
3. Integrate the scoped commit into the creator's workspace.
4. Run the contract's validation again in the integrated workspace.
5. If validation fails, diagnose the first failure. Send a well-specified
   correction to the same Luna task when the fix remains bounded; otherwise
   have the creator own it or route the remaining work to Terra when it now
   needs continuing implementation judgment.

Luna's validation report is evidence. The creator's post-integration validation
is the acceptance gate.

## 5. Archive

After capturing the final result and either accepting or rejecting the work,
archive the task with the task archival tool. Archive failed, cancelled,
timed-out, and abandoned tasks as well as successful ones.

Before Sol reports completion, reconcile the parent ledger and archive any
task whose creator missed cleanup. Keep this cleanup in a finally-style path so
an integration failure does not leave an orphaned task.

Retain in the parent task: worker title and ID, outcome, correction count,
validation result, where a defect was caught, and whether the commit was
accepted. This is enough to compare direct-Luna, Terra-only, and Terra-to-Luna
runs after a few days without keeping worker tasks active.
