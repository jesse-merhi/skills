# Integration

Review each worker result before integrating:

- changed files match ownership
- `tdd` was followed, or the worker stated a valid
  docs/config/generated-code exception
- rendered UI slices used `impeccable` when shaping or refining UI and
  `frontend-ui-validation` before reporting done
- failing test was created before production work
- focused test passes
- no worker reverted or overwrote unrelated changes
- HITL slices stopped at the named checkpoint and returned evidence for
  user/product review

Resolve integration issues locally, then run the feature's relevant package
verification commands.

## Avoid

- "Backend agent", "frontend agent", and "tests agent" splits unless each is
  still part of a vertical behavior slice.
- Giving a worker the whole PRD and hoping it chooses a safe subset.
- Parallel edits to shared contracts without one owner.
- Waiting idly for workers when the orchestrator can do non-overlapping
  critical-path work.
- Accepting a worker result without reading the diff and running appropriate
  verification.
