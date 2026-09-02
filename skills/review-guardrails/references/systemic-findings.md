# Systemic Findings

A systemic finding is a proven problem whose smallest local patch would treat a
symptom while leaving the shared cause in place.

## Signals

Classify a finding as systemic when repository evidence shows one or more of
these:

- the same invariant is implemented or broken in several modules
- repeated review findings share one root cause
- policy is copied into callers instead of owned by one module or seam
- the local fix adds another branch, flag, fallback, parser, validator, or
  compatibility case to an accumulating set
- the correct fix requires changing a shared interface, ownership boundary,
  data model, migration, or cross-cutting dependency direction
- fixing the producer or shared boundary would remove several downstream
  defenses

Do not infer a redesign from one awkward line. Prove the repeated pressure or
misplaced ownership in current code.

## Choose autonomy or consultation

`Systemic` identifies the layer that owns the repair; it does not by itself
make the repair autonomous or require consultation. Do not use a fixed line or
file count as the boundary. Judge whether the durable repair stays inside the
user-authorized contract and whether it introduces a material decision for the
user.

### Contained systemic repair

Apply the durable repair without stopping when all of these hold:

- it stays inside the frozen task contract and owner boundary
- it follows one clear repository or dependency-owned direction
- it does not introduce a new product, security, public-contract, migration,
  dependency, or compatibility decision
- it fits the review scope and diff-growth budget
- its affected flows can be validated within the current review

Do not apply a local Band-Aid merely because the systemic repair is slightly
larger. Record why the shared boundary owns the fix and why the contained
change is preferable to both the local patch and doing nothing.

### Material systemic repair

Consult the user before editing when the durable repair changes what the PR is
about, crosses an owner boundary, requires a new shared contract or migration,
adds or replaces a dependency, presents materially different architecture
options, needs separate delivery or operational coordination, exceeds the
authorized scope budget, or is difficult to validate or reverse within the
current review.

Load `improve-codebase-architecture`, inspect the relevant code and tests, and
present:

```text
What I found: <concrete symptom and affected flows>
Why the local fix is a Band-Aid: <shared cause it leaves behind>
Smallest durable option: <scope, likely files, migration, verification>
Broader option: <only when it offers materially better ownership or leverage>
Recommendation: <one option and why>
Question: <which direction should I take?>
```

Offer one or two scoped options, not a rewrite. Separate emergency containment
from the durable fix when both are relevant. Record the finding in the consult
queue; it remains unresolved until the user explicitly approves, rejects, or
defers it. Do not apply dependent code or substitute a local fallback. Continue
only independent review work, then suspend and ask when none remains or the
clean target is reached. Never claim the review is clean while the decision is
open.
