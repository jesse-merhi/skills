# Ticket design

Tracer-bullet tickets should be:

- thin
- end-to-end
- independently verifiable
- sequenced by dependency
- explicit about blockers

For each proposed ticket, show:

- title
- blocked by
- PR group and delivery: single PR, standalone PR, or stack name/position
- user stories or acceptance criteria covered, when the source has them
- for frontend UI tickets, the web viewport or native device, state, interaction, implementation owner, and evidence that must be provided or reused

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

A single consistent refactor, such as renaming an internal type and updating its usages, can be one ticket even when it touches many files. For persisted data or public contracts, plan any required migration explicitly; a cross-codebase change is not automatically a safe one-step rename.
