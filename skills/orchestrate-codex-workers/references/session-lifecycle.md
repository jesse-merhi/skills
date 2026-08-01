# Independent Luna Task Lifecycle

An independent Luna task is a full Codex task created through the app task
tools. It is the conceptual second delegation level, but it is not a native
subagent. The Terra agent that creates it owns its entire lifecycle.

## 1. Prepare

1. Confirm the user has authorized this delegated workflow and the current
   surface exposes project listing, task creation, waiting, messaging, and
   archival tools.
2. Confirm the assignment passes the Luna cutoff in `model-routing.md`.
3. Prepare the complete contract from `worker-contract.md`.
4. Choose a committed starting branch that contains every dependency the
   worker needs. Use a working-tree snapshot only when uncommitted state is
   essential and the snapshot cannot capture unrelated user changes.

If these conditions are not met, Terra completes the work itself.

## 2. Create

1. List projects and select the matching saved project.
2. For a Git repository, create an isolated worktree task. Avoid a local
   same-directory task that can race the parent workspace.
3. Explicitly select `gpt-5.6-luna` with `max` reasoning.
4. Title the task `luna: <bounded outcome>`.
5. Include the full worker contract in the initial prompt.
6. Record the returned task ID, host ID, title, scope, and starting branch in a
   small parent-side ledger.

If Luna or task creation is unavailable, record the fallback and continue in
Terra. Do not build a replacement MCP server during the implementation task.

## 3. Wait and Steer

- Use the task-wait primitive with a bounded timeout; do useful independent
  work between waits rather than polling repeatedly.
- When the task asks for a decision, supply the missing decision if it is
  inside Terra's assignment. Escalate product or architecture decisions to
  Sol.
- Send corrections to the same task so it retains context. Include the failing
  command, observed output, expected behavior, and permitted scope.
- Require the task to return one scoped commit. Treat the parent task's pull
  request as final delivery.

## 4. Inspect and Integrate

1. Inspect the returned commit and changed paths before integrating it.
2. Reject unrelated edits, broad formatting churn, dependency changes, or
   ownership violations.
3. Integrate the scoped commit into Terra's workspace.
4. Run the contract's validation again in the integrated workspace.
5. If validation fails, diagnose the first failure. Send a well-specified
   correction to the same Luna task when the fix remains bounded; otherwise
   have Terra own it.

Luna's validation report is evidence. Terra's post-integration validation is
the acceptance gate.

## 5. Archive

After capturing the final result and either accepting or rejecting the work,
archive the task with the task archival tool. Archive failed, cancelled,
timed-out, and abandoned tasks as well as successful ones.

Before Sol reports completion, reconcile the parent ledger and archive any
task whose creator missed cleanup. Keep this cleanup in a finally-style path so
an integration failure does not leave an orphaned task.

Retain in the parent task: worker title and ID, outcome, correction count,
validation result, where a defect was caught, and whether the commit was
accepted. This is enough to compare Terra-only and Terra-to-Luna runs after a
few days without keeping worker tasks active.
