# Output

When reporting the audit, include:

- `Kept`: concise list of feature-critical surfaces.
- `Removed/restored`: exact files or hunks cleaned up.
- `Risks checked`: dangerous-removal categories inspected.
- `Validation`: commands run and pass/fail result.
- `Remaining caveats`: only real residual risk, not generic uncertainty.

For large diffs, use a table:

| File | Classification | Keep | Rubbish / Risk | Action |
|---|---|---|---|---|

## Subagents

If the user explicitly asks for subagents or parallel reviewers, split by
subsystem:

- agent/runtime/session
- plugin API/types/hooks
- gateway/protocol/approval
- UI/rendering/controllers
- docs/config/tests

Ask each subagent to classify every changed file in its scope against the
feature intent and to flag unrelated churn or dangerous removals. Do not ask
them to edit files unless write scopes are disjoint and explicitly assigned.
