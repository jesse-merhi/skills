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

## Stop And Consult

Do not apply the local Band-Aid. Load `improve-codebase-architecture`, inspect
the relevant code and tests, and present:

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
queue, continue only independent review work, and suspend before claiming the
review is clean.
