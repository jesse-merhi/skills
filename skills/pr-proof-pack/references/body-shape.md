# PR Body Shape

## Contents

- [Lead With the New Behavior](#lead-with-the-new-behavior)
- [Default Shape](#default-shape)
- [UI Proof](#ui-proof)
- [API and Backend Proof](#api-and-backend-proof)
- [Tables](#tables)
- [What to Leave Out](#what-to-leave-out)

Use the net diff to discover what changed, not as the structure of the PR body.
A reviewer should understand the resulting behavior before reading implementation
details, file lists, test commands, or agent-process notes.

## Lead With the New Behavior

Open with what a person, API consumer, operator, or downstream system can do or
observe after the PR merges. Name the actor, action or condition, and outcome.

Good:

> Invalid supplier contact details are now rejected before persistence. Create
> and update requests return the same field-level validation messages, so the UI
> can show a consistent error without saving partial data.

Bad:

> This PR updates validation, routers, tests, and OpenAPI files for SUP-142.

The first version explains the new behavior. The second makes the reviewer
reconstruct it from implementation categories and unexplained task shorthand.

When the change fixes a bug, state the old behavior only when it makes the new
behavior easier to understand:

> Previously, changing the sort direction reset the selected filters. Filters
> now remain selected while results reorder.

Do not narrate the coding process or repeat the same claim across multiple
sections.

## Default Shape

Use only the sections the change needs. Rename headings when a specific human
label is clearer than a generic one.

````md
## New behavior

<One short paragraph describing who experiences the change, what they do, and
what happens now. Include the previous behavior only when the contrast matters.>

- <Important scenario or rule and its observable outcome.>
- <Second distinct scenario or rule, if needed.>

## Stack context

<Include only for stacked PRs. Example: "Part 2 of 3 — API endpoints. Depends
on #41; followed by #43.">

## UI proof

<Include for human-visible UI changes. Put each image directly in the PR body.>

![Descriptive alt text](https://github.com/user-attachments/assets/...)

**What this shows:** <The exact new behavior visible in the image.>

**State:** <Route, fixture or account state, and viewport. State why a full-page
capture was necessary when applicable.>

## How to verify

1. <Starting state or fixture.>
2. <Action a reviewer can perform.>
3. <Expected new outcome.>

## Checks

- `<focused command>` — passed.
- <Relevant CI coverage, or an honest not-run reason when applicable.>

## Implementation notes

<Optional. Include only a non-obvious constraint, migration, compatibility
decision, rollout detail, or risk that materially helps review.>
````

Keep `New behavior` first. After that, order proof by usefulness to a reviewer:
for a stacked PR, one short `Stack context` section; then visible UI,
request/response or state-transition proof, manual verification, and automated
checks. Put optional implementation notes last unless a warning must be read
before verification.

Keep stack context navigational, not explanatory. Name the layer's position,
purpose, direct dependency, and next PR when present. Do not repeat the whole
feature summary in every PR; the GitHub stack map already provides the full
chain.

For a tiny change, a short paragraph plus checks may be enough. Do not create
empty sections or pad the body to match the template.

## UI Proof

Show the changed UI as early as possible after the behavior description. Add
images directly to the main PR body, never to a table or a detached comment.
Prefer GitHub-hosted attachments added through CDP when that path is available.

Put the useful context immediately below each image:

- **What this shows:** the specific claim the image proves;
- **State:** the route and any fixture, role, permission, filter, or responsive
  state needed to reproduce it;
- **Viewport:** include it in `State` when size affects the behavior;
- **Capture:** mention an element, viewport, or full-page crop only when that
  choice helps the reviewer interpret the image.

Use descriptive alt text. Do not use a file name such as `screenshot-1.png` as
the explanation.

For before/after proof, place the images one after the other under `Before` and
`Now` subheadings. Each image gets its own explanation below it. `Before` means
the PR base behavior, not an earlier commit from the feature branch.

If a human-visible UI change has no screenshot, add one direct sentence stating
the concrete blocker or the narrow reason an image would not prove changed UI.
Do not add a screenshot section for backend-only changes.

## API and Backend Proof

Describe the changed contract as a behavior, then show the smallest request,
response, state transition, query result, or data example that proves it. Do not
introduce the example with vague labels such as "API behavior example."

````md
## New behavior

Supplier create and update requests now reject invalid Australian phone numbers
before persistence. Both endpoints return the same validation message.

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

## Checks

- Shared validation, contract, and affected router tests pass in CI.
````

Keep examples copy-pasteable when possible. If auth, fixture setup, or
environment data prevents that, label the example as representative and state
the required role or fixture. Do not paste secrets, long terminal output, or
every exercised request.

## Tables

Use a table only when rows need to be compared across stable axes, such as:

- scenario / previous behavior / new behavior;
- permission / allowed action / denied action;
- input / resulting status / persisted state.

Never put images in a table. Tables constrain image size, hide annotations, and
make before/after proof harder to read. Put images in the main body with their
context immediately below them.

If the content is a list of facts, a sequence, a file inventory, or prose split
into columns, use sentences, bullets, or short subsections instead. Keep cells
brief; if a cell needs multiple clauses, a file list, or a long command, the
table is not helping.

## What to Leave Out

Remove content that reports the agent's work without helping a human understand
or verify the new behavior:

- generic `Summary`, `What Changed`, and `Proof` sections that repeat one
  another;
- net-diff tables, file inventories, and implementation buckets presented as
  behavior;
- unexplained ticket IDs, sprint names, bug-bash labels, or thread shorthand;
- test-file lists or long command inventories in place of behavioral proof;
- review-loop history, agent names, internal run labels, and planning notes;
- screenshots of unchanged routes or images without a specific proof claim;
- image tables, local-only image paths, and attachments left only in comments;
- raw terminal dumps, secrets, tokens, and verbose CI output;
- claims such as "works as expected" or "tests pass" without saying what
  behavior was exercised.
- changes owned by another stack layer or a repeated whole-stack summary.

Implementation detail belongs in the body only when it explains a meaningful
constraint, risk, migration, compatibility decision, rollout concern, or review
hotspot. Otherwise, let the diff carry it.
