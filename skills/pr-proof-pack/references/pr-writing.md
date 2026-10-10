# PR writing

Give the PR a title that describes the outcome. Use `speak-fking-english` for the opening, explanation and proof captions. Make the experienced problem and fix clear before implementation detail.

Use this template as a starting point. Adapt the headings and detail to the change rather than filling every section mechanically.

```md
**Problem:** <What is going wrong or getting in someone's way?>

**Fix:** <What changes for them?>

## Proof

<Place any useful explanation diagram before the practical evidence.>

**Before <what happened before>**
<Evidence showing the previous behavior.>

**After <what happens now>**
<Comparable evidence making the change obvious.>

<Keep consequential limitations and necessary rollout actions visible here.>

<details>
<summary>Supporting checks and change details</summary>

<Relevant check results and their limits. Include reproduction steps or exact commands when the reader needs them to act.>

<Optional context affecting review or rollout, such as a migration or compatibility decision.>

<Category table from pr-net-diff, including files, additions, deletions, and totals.>

</details>
```

Include the category breakdown for every PR. Use the helper's totals directly; if you refine its categories, account for each path once and keep the totals consistent. Binary files contribute to file counts, not textual line counts.

Do not add a generic verification checklist just to fill the template. The presentation does not reduce required checks or proof. If the provider cannot render optional details, use a short supporting section after the proof.

For a new capability without a meaningful before state, explain that briefly and show what it enables. Keep the description focused on what helps someone review the change.
