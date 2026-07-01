# Clean Criteria

Treat a cold review run as clean only when:

- The reviewer reports zero actionable issues.
- Critical and important findings are always actionable.
- Minor findings count as actionable when the reviewer says they should be fixed
  before merge, or when they indicate a real bug, regression, missing test,
  unsafe behavior, or confusing user experience.
- Nits, optional style suggestions, and "consider" items do not reset the
  counter unless they reveal a real defect.
- A run whose only findings match the open consult queue is
  `clean-except-queue`: it counts toward the streak, but the loop suspends as
  blocked-on-consult instead of reporting a clean verdict while the queue is
  open.
- An errored, ambiguous, incomplete, or wrong-target review is not clean.

When in doubt, treat the run as `has_findings`. Extra review cycles are cheaper
than falsely declaring convergence.
