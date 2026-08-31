# Confirmation pass

Before finalizing a runtime finding, answer:

1. What exact input, state, timing, permission, platform, or dependency version
   triggers this?
2. What does the code do now, and why is that wrong?
3. Which current contract proves it is wrong: caller expectation, test, docs,
   type, API, UI behavior, security boundary, or previous behavior?
4. What is the root cause, which boundary owns it, and what is the smallest
   durable repair there?
5. Could this be a false positive because of an upstream guard or invariant?
6. Why is the recommended repair better than doing nothing after counting its
   complexity, tests, and new failure modes?

If answers 1-3 are hand-wavy, keep inspecting or drop the finding. If answers
4-6 do not justify a repair, do not patch; reject a low-value candidate or
investigate or consult on a proven material problem.
Confirm that the finding record contains a complete risk rating. For a
defensive-code finding, check capacity claims and delimiter claims
independently; evidence for one does not prove the other.

For a maintenance finding, answer instead:

1. What exact changed code is unnecessarily complex, duplicated, or unused?
2. What repository evidence proves that present maintenance problem?
3. What present reading, change, test, or ownership cost does it add?
4. What root cause and ownership error creates that cost?
5. What smaller durable code preserves all current behavior?
6. What boundary, domain concept, dependency direction, expected variability,
   or useful test seam would the simplification preserve or remove?
7. Why is changing the code better than tolerating the current maintenance
   cost?

If the evidence for answers 2-3 is hand-wavy, drop the finding.
