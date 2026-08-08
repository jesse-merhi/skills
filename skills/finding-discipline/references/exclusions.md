# Exclusions

Do not report:

- style, naming, formatting, architecture taste, or "could be cleaner"
  refactors without a concrete current problem
- generic missing tests unless the missing test hides a specific failure mode
- speculative security concerns without an executable path
- broad "consider" suggestions
- duplicate findings that share the same root cause
- stale findings against code that is not part of the reviewed diff

If something is worth mentioning but not actionable, put it in residual risk or
notes, not findings.
