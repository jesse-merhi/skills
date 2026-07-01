# Confirmation Pass

Before finalizing each finding, answer:

1. What exact input, state, timing, permission, platform, or dependency version
   triggers this?
2. What does the code do now, and why is that wrong?
3. Which current contract proves it is wrong: caller expectation, test, docs,
   type, API, UI behavior, security boundary, or previous behavior?
4. What is the smallest reasonable fix?
5. Could this be a false positive because of an upstream guard or invariant?

If answers 1-3 are hand-wavy, keep inspecting or drop the finding.
