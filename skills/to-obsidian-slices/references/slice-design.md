# Slice Design

Tracer-bullet slices should be:

- thin
- end-to-end
- independently verifiable
- sequenced by dependency

Mark each slice:

- `AFK` when an agent can execute without more product judgment
- `HITL` when user/product review is needed mid-flight

For each proposed slice, show:

- title
- mode: `AFK` or `HITL`
- blocked by
- user stories or acceptance criteria covered, when the source has them
- for frontend UI slices, the viewport/state that must be proven with
  `frontend-ui-validation`

Ask the user:

- Does the granularity feel right?
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- Are the correct slices marked `AFK` and `HITL`?

## Good Slices

Prefer:

- `User can create a basic project and see it after refresh`
- `User sees validation when project name is empty`
- `Archived project disappears from active project list`

Avoid:

- `Add database table`
- `Build API endpoint`
- `Create frontend form`

Layer tasks are implementation details. A slice is a behavior.
