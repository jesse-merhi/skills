# Exclusions

Do not report:

- style, naming, formatting, or architecture taste without a concrete bug
- generic missing tests unless the missing test hides a specific failure mode
- speculative security concerns without an executable path
- broad "consider" suggestions
- duplicate findings that share the same root cause
- stale findings against code that is not part of the reviewed diff
- "could be cleaner" refactors unless the current shape breaks behavior

If something is worth mentioning but not actionable, put it in residual risk or
notes, not findings.
