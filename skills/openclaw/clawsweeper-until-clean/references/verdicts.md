# Verdicts

Classify each fresh, finished response:

- `clean`: no actionable findings remain.
- `has_findings`: at least one actionable finding remains.
- `ambiguous`: errored, "I couldn't review", rate-limited, no structured
  verdict, or not clearly finished.

## What Counts As Clean

Treat a Clawsweeper re-review as clean only when:

- The response lists zero items in its actionable, blocking, or must-fix bucket.
- Nits, style observations, or "consider"-tier suggestions do not count as
  findings unless Clawsweeper itself classifies them as actionable.
- The response references the current head SHA or otherwise makes clear it
  reviewed the latest tree.
- The response is a finished verdict, not a placeholder.

When in doubt, treat the re-review as `has_findings` or `ambiguous`. False
negatives defeat the skill.
