# PR body shape

A reviewer should know what broke, why it mattered, and how this PR fixes it
before they reach the first heading. Use the net diff to discover the story;
do not turn its files, commits, or implementation buckets into the story.

## Opening contract

Use the first four sentences deliberately:

1. State what broke in terms a person can observe.
2. State the impact or risk: why should the reviewer care?
3. State how this PR fixes the cause, using plain language before mechanism.
4. State the new observable outcome.

For a feature, replace "what broke" with the missing capability and its impact.
Define or remove any term that a reviewer would need repository-specific
context to understand.

Good:

> ClawSweeper could publish a review even when its runner had not proved it could
> read the checkout. That made an apparently clean review untrustworthy because
> the model may not have seen the code under review. This PR makes the runner
> read a known file from the exact PR checkout before review begins. If that
> check fails, ClawSweeper stops and records the reason instead of publishing.

Weak:

> This PR adds exact-head admission, runner preflight provenance, and cache
> promotion across the review lifecycle.

## Size budget

Default to at most 300 words of prose, excluding copyable proof snippets and
commands. Exceed that only when the PR has multiple independently important
behaviors, migration steps, or risks that a reviewer must act on. Remove
repeated claims, exhaustive test inventories, review history, file lists, and
implementation detail already clear from the diff.

## Change breakdown

When a PR spans multiple reviewer-meaningful parts, or its size needs
explanation, include one compact direct-base breakdown after the opening. Use
the `+LOC` and `-LOC` totals from `pr-net-diff --markdown`. Every changed path
must belong to exactly one row, and the rows must add up to the reported total.

Start with implementation, tests and fixtures, documentation, CI/config/tooling,
and dependencies/generated files. If implementation spans distinct product
areas, replace that row with clearer non-overlapping labels grounded in the
paths. Keep the table to the few rows that change how the PR should be reviewed.
Binary files count as files but do not have textual LOC.

```md
## Change breakdown

| Part | Files | +LOC | -LOC |
| --- | ---: | ---: | ---: |
| Checkout admission | 5 | +312 | -41 |
| Review result plumbing | 4 | +407 | -58 |
| Tests and fixtures | 18 | +1,130 | -30 |
| **Total** | **27** | **+1,849** | **-129** |
```

Do not call a PR "large" or "huge" without this breakdown. Do not use file
count, commit count, or a raw file inventory as a substitute.

## Default shape

Use only the sections the change needs:

````md
<Two sentences: what broke or was missing, then why it matters.>

<Two sentences: how this PR fixes it, then what happens now.>

## Proof

**Before: direct base**

<Small copyable result, image, or recording showing the broken outcome.>

**After: PR**

<Matched result showing the corrected outcome and important side effect.>

<One sentence explaining the shared input, fixture, environment, and boundary.>

## How to verify

1. <Starting state or fixture.>
2. <Action or command a reviewer can perform.>
3. <Expected new outcome.>

## Implementation notes

<Optional: one non-obvious constraint, migration, compatibility decision, or
risk that materially changes how the PR should be reviewed or landed.>
````

For a new feature without a meaningful baseline, say so in one sentence and
show the new entry point and outcome. For a tiny change, the opening and one
proof block may be enough.

## Proof shape

Follow [proof-selection.md](proof-selection.md). Use text blocks for textual
behavior and uploaded media only for visual behavior. Put enough context beside
the evidence to reproduce it: the shared input, fixture, account or role,
environment, and any viewport or capture detail that affects the claim.

Textual bug fix:

````md
## Proof

Same pull request and restricted checkout in both runs:

**Before: direct base**

```text
review_status: complete
checkout_read_verified: false
published: true
```

**After: PR**

```text
review_status: failed
failure: runner could not read the selected checkout
published: false
```
````

For matched visual proof, label the direct-base and PR evidence explicitly.
Use one side-by-side image for a readable static comparison or two short
recordings for an interaction. Never put media in a Markdown table.

## API and backend proof

Show the smallest copyable request, response, and resulting state that proves
the contract. For rejected work, show both the boundary response and the absence
of the invalid side effect. For successful work, show the response and the
persisted or emitted result. Keep secrets and verbose output out.

## Tables

Use a table for the compact change breakdown above or when several cases need
comparison across stable axes, such as input, previous outcome, new outcome,
and side effect. Use adjacent code blocks for one before/after case. Do not use
tables as a file inventory or a way to compress several paragraphs into cells.

## What to leave out

- generic summary sections that repeat the opening;
- raw file inventories and implementation buckets that do not explain scope;
- routine test, build, CI, coverage, lint, or type-check results;
- review-loop history, agent activity, run labels, and planning notes;
- unexplained project terms, ticket shorthand, paths, or class names;
- every edge case already covered by tests when one representative proof shows
  the behavior;
- claims such as "works as expected" without the observed result.
