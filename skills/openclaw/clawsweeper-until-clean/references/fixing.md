# Fixing

- Apply the minimal direct edit that resolves each Clawsweeper finding, or use
  the repo-specific fix workflow when one exists.
- Do not bundle drive-by refactors into the fix step.
- Each fix should map back to a Clawsweeper finding, so the next re-review sees
  a clean, narrow change.
- Push the fix commit before re-triggering. Clawsweeper reviews what is on the
  remote, not your local tree.
- Verify the fixes actually changed the relevant code. Diff the fix before
  continuing.
