# Confirmation Pass

Before finalizing a runtime finding, answer:

1. What exact input, state, timing, permission, platform, or dependency version
   triggers this?
2. What does the code do now, and why is that wrong?
3. Which current contract proves it is wrong: caller expectation, test, docs,
   type, API, UI behavior, security boundary, or previous behavior?
4. What is the smallest reasonable fix?
5. Could this be a false positive because of an upstream guard or invariant?

If answers 1-3 are hand-wavy, keep inspecting or drop the finding.

For a maintenance finding, answer instead:

1. What exact changed code is unnecessary?
2. Which callers, producers, contracts, or invariants prove that its defensive
   state is implausible, or that its indirection has no current purpose?
3. What present reading, change, test, or ownership cost does it add?
4. What smaller code preserves all current behavior?
5. Does the code actually preserve a boundary, domain concept, dependency
   direction, expected variability, or useful test seam?

If the evidence for answers 2-3 is hand-wavy, drop the finding.
