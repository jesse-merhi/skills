# Worker assignment contract

Each worker prompt must include:

- the exact spec/slice acceptance criterion they own
- the slice mode: `AFK`, `HITL`, or "unspecified"
- for HITL slices, the exact checkpoint where the worker must stop
- the expected vertical path through the system
- files/modules they may edit
- files/modules they must avoid
- required skills to load, especially `tdd` and the repo/domain
  skill
- for rendered UI slices, required skills to load: `frontend-design` before
  coding or visual refinement, `design-engineering` when motion or interaction
  craft is material, and `frontend-ui-validation` before reporting done
- a reminder that they are not alone in the codebase and must not revert or
  overwrite others' edits
- required final report: changed files, tests run, red/green evidence, UI
  validation evidence when relevant, HITL evidence when relevant, blockers, and
  any assumptions

Prefer worker prompts shaped like:

```text
You own Slice N: <behavior>.
Mode: <AFK | HITL | unspecified>.

Load <repo skill> and tdd.
Write one failing test for <acceptance criterion>, prove it fails for the
expected reason, implement only enough production code to pass, then run
the focused test.

If the mode is HITL, stop at this checkpoint before continuing:
<review point>. Report the evidence needed for user/product review and
wait for the orchestrator or user to decide.

If this slice changes rendered UI, load `frontend-design` before coding or
visual refinement. Load `design-engineering` when motion or interaction craft
is material. Run `frontend-ui-validation` before reporting done and include the
viewport/state proof in your final report.

Write ownership: <files/modules>.
Avoid: <files/modules owned by other workers>.

You are not alone in this codebase. Do not revert or overwrite changes
outside your ownership. Adapt to existing edits if you encounter them.

Final report: changed files, tests run, red/green evidence, UI
validation evidence when relevant, HITL evidence when relevant,
blockers, and assumptions.
```
