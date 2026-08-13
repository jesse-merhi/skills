# PR Body Shape

## Contents

- [Lead With the New Behavior](#lead-with-the-new-behavior)
- [Default Shape](#default-shape)
- [Visual Proof](#visual-proof)
- [API and Backend Proof](#api-and-backend-proof)
- [Tables](#tables)
- [What to Leave Out](#what-to-leave-out)

Use the net diff to discover what changed, not as the structure of the PR body.
A reviewer should understand the resulting behavior before implementation
details, file lists, test commands, or agent-process notes.

## Lead With the New Behavior

Open with what a person, API consumer, operator, or downstream system can do or
observe after the PR merges. Name the actor, action or condition, and outcome.
Restore any premise a reviewer needs before introducing technical vocabulary.

Good:

> Invalid supplier contact details are now rejected before saving. Create and
> update requests return the same field-level message, so the UI can explain the
> problem without leaving partial data behind.

Bad:

> This PR updates validation, routers, tests, and OpenAPI files for SUP-142.

When a bug fix needs contrast, state it plainly:

> Previously, changing the sort direction cleared the selected filters. Filters
> now stay selected while the results reorder.

## Default Shape

Use only the sections the change needs, except that `Visual proof` is required
for every PR. Rename generic headings when a specific human label is clearer.

````md
## New behavior

<One short paragraph: who experiences the change, what they do, and what happens
now. Include the previous behavior only when the contrast matters.>

- <Important scenario and its observable outcome.>
- <Second distinct scenario, if needed.>

## Stack context

<Only for stacked PRs. Example: "Part 2 of 3 — Reject invalid supplier data.
Depends on #41; followed by #43.">

## How it works

<Include the smallest useful explanation visual for multi-step, multi-actor,
stateful, decision-based, structural, or before-and-after behavior. This may be
pseudocode, a call tree, component tree, file tree, focused diff, or Mermaid.
Introduce it with one sentence that says what the reviewer should learn.>

## Visual proof

![Descriptive evidence](https://github.com/user-attachments/assets/...)

**What this shows:** <The exact current behavior or verification result.>

**State:** <Route, fixture, account, command, environment, viewport, and crop
details needed to reproduce and interpret the image.>

## How to verify

1. <Starting state or fixture.>
2. <Action or command a reviewer can perform.>
3. <Expected new outcome.>

## Checks

- `<focused command>` — passed: <behavior it exercised>.
- <Relevant CI coverage, or an honest not-run reason.>

## Implementation notes

<Optional: only a non-obvious constraint, migration, compatibility decision,
rollout detail, or risk that materially helps review.>
````

Keep `New behavior` first. After that, order proof by usefulness: short stack
context when needed, the explanatory diagram, visual evidence, manual
verification, automated checks, then optional implementation notes.

For a tiny change, a paragraph, one evidence screenshot, and one focused check
may be enough. Do not add empty sections or decorative diagrams.

## Visual Proof

Every PR needs at least one uploaded screenshot in the main body. Put the most
useful evidence soon after the behavior description and diagram.

For UI changes, show every distinct changed state. For terminal, backend,
infrastructure, docs, and test-only changes, show a focused terminal command and
result or the meaningful rendered output. Keep the same command and result as
copyable text under `How to verify` or `Checks`.

Put useful context immediately below each image:

- **What this shows:** the exact current behavior or result the image proves;
- **State:** the route, fixture, role, permission, environment, or command;
- **Viewport:** include it when size affects UI behavior;
- **Capture:** name an element, viewport, terminal region, or full-page crop when
  the choice helps interpretation.

Use descriptive alt text. A filename such as `screenshot-1.png` is not an
explanation.

For before/after proof, place images one after another under `Before` and `Now`.
Each needs its own explanation. `Before` means the direct PR base, not an earlier
commit from the feature branch.

## API and Backend Proof

Describe the changed contract as behavior. Show the smallest copyable request,
response, state transition, query result, or data example that proves it. Then
add uploaded visual evidence of the focused request/result or contract check.

````md
## New behavior

Supplier create and update requests now reject invalid Australian phone numbers
before saving. Both endpoints return the same message.

## Request and response

An invalid phone number now fails before supplier creation:

```sh
curl -i -X POST "$API_URL/suppliers" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  --data '{"name":"Acme","pointOfContactPhoneNumber":"+15555550123"}'
```

Expected response:

```http
HTTP/1.1 400 Bad Request
```

```json
{
  "message": "Please enter a valid phone number"
}
```

## Visual proof

![Invalid phone number is rejected before save](https://github.com/user-attachments/assets/...)

**What this shows:** The focused request returns the expected field-level error,
and the follow-up query confirms no supplier was saved.

**State:** Local API fixture with an admin test account; terminal region crop.
````

Keep examples copy-pasteable when possible. Label representative examples and
state required roles or fixtures. Never include secrets or verbose output.

## Tables

Use a table only when rows need comparison across stable axes, such as scenario
/ previous behavior / new behavior or input / status / persisted state.

Never put images in a table. If content is a sequence, list of facts, file
inventory, prose split into columns, or cells with several clauses, use prose,
bullets, or a diagram instead.

## What to Leave Out

Remove content that reports agent activity without helping a person understand
or verify the behavior:

- generic `Summary`, `What Changed`, and `Proof` sections that repeat each other;
- net-diff tables, file inventories, and implementation buckets as behavior;
- unexplained ticket IDs, sprint names, bug-bash labels, or thread shorthand;
- test-file lists or long command inventories in place of behavioral proof;
- review-loop history, agent names, run labels, and planning notes;
- local-only paths, image tables, and attachments left only in comments;
- raw terminal dumps, tiny terminal text, secrets, tokens, or verbose CI output;
- claims such as "works as expected" without saying what was exercised;
- changes owned by another stack layer or a repeated whole-stack summary.
