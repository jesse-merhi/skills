# Large Diff Discovery Slices

Use slices to improve coverage, not to multiply clean gates.

## Trigger

Run this stage once when the surface map contains at least three substantially
independent runtime surfaces whose entrypoints and downstream effects can be
reviewed separately. File count alone is not a trigger.

## Dispatch

- Create two to four read-only discovery slices. Merge small or heavily
  overlapping surfaces rather than creating more agents.
- In Codex, use `fork_turns: "none"`. Give each reviewer a self-contained text
  brief with the target, base, slice boundary, shared contracts, and neutral
  risk checklist.
- Tell each reviewer to inspect its slice and directly shared contracts, then
  return only actionable finding candidates with evidence.
- Dispatch this batch once. Do not let slice reviewers spawn reviewers, run
  clean-until loops, fix code, or request cold reviews of their output.

## Integrate

The coordinator deduplicates candidates into the single tracked-finding
registry. Cross-slice root causes become one finding owned by the coordinator.
Unproven observations are discarded or investigated before Phase 1.

The normal whole-target native and cold phases remain authoritative. A slice is
never declared clean, and there is no clean-pass requirement per slice. If a
later fix materially adds a new runtime surface, update the map; do not rerun
all discovery slices unless the target changed enough to invalidate them.
