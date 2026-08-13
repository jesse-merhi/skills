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

<Optional. Include only the support returned by the final
`speak-fking-english` pass. Omit this section when that pass chooses prose.>

## Visual proof

<Provider-hosted evidence selected in `proof-selection.md` and captured by
`screenshots.md`.>

![Changed behavior at its observable outcome](https://github.com/user-attachments/assets/...)

**What this shows:** <The exact implemented behavior visibly working in
practice. Do not describe test, build, CI, or validator output here.>

**State:** <Starting state, input, action, route, fixture, account, environment,
viewport, dataset, and capture details needed to reproduce the behavior.>

## How to verify

1. <Starting state or fixture.>
2. <Action or command a reviewer can perform.>
3. <Expected new outcome.>

## Implementation notes

<Optional: only a non-obvious constraint, migration, compatibility decision,
rollout detail, or risk that materially helps review.>
````

Keep `New behavior` first. After that, order proof by usefulness: short stack
context when needed, any useful explanation support, practical evidence, manual
verification, then optional implementation notes.

For a tiny non-interactive change, a paragraph and one practical evidence item
may be enough. Omit empty sections.

## Visual Proof

Use the practical evidence chosen in `proof-selection.md` and captured through
`screenshots.md`. Put the most useful item soon after the behavior description
and keep reproduction steps as copyable text under `How to verify`.

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

Show both the boundary result and the important side effect: saved or rejected
state, emitted event, queued job, changed record, idempotent retry, or absence of
partial data. A contract test or test runner is supporting validation only.

## Performance Proof

Pair the visual before/after with a Markdown comparison table. Use matched
hardware, environment, dataset, cache state, scenario, measurement method, and
sample size. Report representative values and variability rather than one best
run.

| Scenario | Base | PR | Change | Samples |
| --- | ---: | ---: | ---: | ---: |
| <Observable operation> | <median/p95> | <median/p95> | <percent> | <count> |

## Tables

Use a table only when rows need comparison across stable axes, such as scenario
/ previous behavior / new behavior or input / status / persisted state.

Never put images in a table. If content is a sequence, list of facts, file
inventory, prose split into columns, or cells with several clauses, use prose
or bullets.

## What to Leave Out

Remove content that reports agent activity without helping a person understand
or verify the behavior:

- generic `Summary`, `What Changed`, and `Proof` sections that repeat each other;
- net-diff tables, file inventories, and implementation buckets as behavior;
- unexplained ticket IDs, sprint names, bug-bash labels, or thread shorthand;
- review-loop history, agent names, run labels, and planning notes;
- claims such as "works as expected" without saying what was exercised;
- changes owned by another stack layer or a repeated whole-stack summary.
