# PR writing

Give the PR a title that describes the outcome. Explain what changed, why it matters, and what happens now. Use `speak-fking-english` for the writing pass.

Use this template as a starting point. Adapt the headings and detail to the change rather than filling every section mechanically.

```md
<Explain the problem or missing capability and how this PR addresses it.>

## Change breakdown

<Category table from pr-net-diff, including files, additions, deletions, and totals.>

## Proof

<Place any useful explanation diagram before the practical evidence.>

**Before <what happened before>**
<Evidence showing the previous behavior.>

**After <what happens now>**
<Comparable evidence making the change obvious.>

## How to verify

<Starting conditions, action or command, and expected result.>

## Implementation notes

<Optional context affecting review or rollout, such as a migration or compatibility decision.>
```

Include the category breakdown for every PR. Use the helper's totals directly; if you refine its categories, account for each path once and keep the totals consistent. Binary files contribute to file counts, not textual line counts.

For a new capability without a meaningful before state, explain that briefly and show what it enables. Keep the description focused on what helps someone review the change.
