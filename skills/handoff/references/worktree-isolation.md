# Worktree isolation

Treat the current working directory as the coordinator's workspace, not the
default worker workspace.

Use a separate git worktree for each worker when:

- the worker may edit files, run implementation slices, repair code, create a
  commit, or open a PR
- multiple handoffs are launched from one coordinator session
- workers own different features, specs, review findings, bug fixes, or slices
- deleting or archiving the coordinator session/worktree would break the worker

Use the current checkout only for explicitly read-only discovery, monitoring,
summarization, proof gathering, or when the user explicitly asks the worker to
use that checkout. If the task is ambiguous, assume the worker needs isolation.

For parallel handoffs, give each worker a distinct worktree path and branch. Use
names that match the worker's scope, for example:

```text
../checkout-worker-a        branch work/checkout-worker-a
../billing-api-repair       branch work/billing-api-repair
```

Do not point several agents at `"$PWD"` just because the handoff documents were
created there. Put shared research artifacts, specs, notes, and source paths in
the handoff as read-only context; make implementation happen in the worker's own
worktree.
