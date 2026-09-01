# Ticket design

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
- PR group and delivery: single PR, standalone PR, or stack name/position
- user stories or acceptance criteria covered, when the source has them
- for frontend UI tickets, the viewport/state that must be proven with
  `frontend-ui-validation`

Ask the user:

- Does the granularity feel right?
- Are the dependency relationships correct?
- Does each blocker genuinely gate the blocked ticket?
- Should any tickets be merged or split further?
- Do the PR groups form cohesive review units?
- Are stack edges real code dependencies rather than convenient ordering?
- Are the correct tickets marked `AFK` and `HITL`?

## PR delivery groups

Tickets organize implementation; PR groups organize review. Do not assume one
ticket equals one PR or that every ticket blocker becomes a PR base.

1. Group tickets that form one cohesive, independently verifiable review unit.
2. Collapse ticket edges inside each group, then derive dependencies between
   the remaining review groups.
3. Use one PR when only one review group remains.
4. Use one `gh-stack` stack only when two or more review groups form a strict
   linear dependency path. Put foundations at the bottom and consumers above.
5. Use standalone PRs or separate stacks for independent or forked paths. Never
   serialize independent groups merely to fit GitHub's linear stack model.
6. Before readiness or merge, apply the Review gate and Sign-off gate from
   `AGENTS.md` to every PR. The Review gate must cover the exact head; Sign-off
   persists for the PR across later heads.

Every review group must name the outcome a reviewer can accept independently.
If grouping tickets would make the PR too broad, or a group cannot stay green
against its direct base, split or reorder the groups before asking for approval.

## Good tickets

Prefer:

- `User can create a basic project and see it after refresh`
- `User sees validation when project name is empty`
- `Archived project disappears from active project list`

Avoid:

- `Add database table`
- `Build API endpoint`
- `Create frontend form`

Layer tasks are implementation details. A ticket is a behavior.

## Wide refactors

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

Do not automatically put parallel migration batches into one stack. The expand
group may be the bottom of a linear stack only when every later group truly
depends on the previous one. Otherwise publish the independent batches as
standalone PRs or separate stacks, then gate contract work on all of them.
