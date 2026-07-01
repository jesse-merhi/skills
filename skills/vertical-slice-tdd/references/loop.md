# Loop

1. Pick the smallest externally meaningful behavior.
2. Write one failing test for that behavior. Prefer the highest level that still
   gives fast, stable feedback.
3. Run the test and show that it fails for the expected reason.
4. Implement only enough production code to pass that test.
5. Run the focused test.
6. Refactor only after green, keeping behavior unchanged.
7. Repeat for the next slice.
8. Finish with the package's relevant typecheck/lint/test commands.
