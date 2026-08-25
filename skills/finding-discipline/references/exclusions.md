# Exclusions

Do not report:

- style, naming, formatting, architecture taste, or "could be cleaner"
  refactors without a concrete current problem
- generic missing tests unless the missing test hides a specific failure mode
- speculative security concerns without an executable path
- broad "consider" suggestions
- duplicate findings that share the same root cause
- stale findings against code that is not part of the reviewed diff

Use residual risk only for a proven trigger and consequence that the current
change deliberately leaves unresolved. Reject unsupported possibilities rather
than preserving them as notes.
