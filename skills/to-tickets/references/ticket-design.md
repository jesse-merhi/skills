# Ticket Design

Tracer-bullet tickets should be:

- thin
- end-to-end
- independently verifiable
- sequenced by dependency
- explicit about blockers

Mark each ticket:

- `AFK` when an agent can execute without more product judgment
- `HITL` when user/product review is needed mid-flight

For each proposed ticket, show:

- title
- mode: `AFK` or `HITL`
- blocked by
- user stories or acceptance criteria covered, when the source has them
- for frontend UI tickets, the viewport/state that must be proven with
  `frontend-ui-validation`

Ask the user:

- Does the granularity feel right?
- Are the dependency relationships correct?
- Does each blocker genuinely gate the blocked ticket?
- Should any tickets be merged or split further?
- Are the correct tickets marked `AFK` and `HITL`?

## Good Tickets

Prefer:

- `User can create a basic project and see it after refresh`
- `User sees validation when project name is empty`
- `Archived project disappears from active project list`

Avoid:

- `Add database table`
- `Build API endpoint`
- `Create frontend form`

Layer tasks are implementation details. A ticket is a behavior.

## Wide Refactors

Wide refactors are the exception to vertical slicing. A wide refactor is one
mechanical change whose blast radius crosses much of the codebase, such as
renaming a column, retyping a shared symbol, or changing a common data shape.

Use expand-contract:

- Expand: add the new form beside the old form without breaking callers.
- Migrate: move callers in batches sized by blast radius, usually by package,
  directory, route, or product area. Each batch is a ticket blocked by expand.
- Contract: remove the old form after every migration batch is done. This ticket
  is blocked by all migration tickets.

If migration batches cannot stay green independently, keep the same order but
name a final integrate-and-verify ticket. In that case, green is promised there,
not by every intermediate batch.
