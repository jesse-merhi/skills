# Setup And Lenses

Do once before review loops, then redo only if the target, base, or dirty local
overlay changes.

1. Run `<skill-dir>/scripts/check-review-models --engine <selected-engine>`.
   Stop before Phase 1 only when the selected engine's model or configured
   effort is unavailable, or its catalogue check cannot be completed.

2. Map changed flows, entrypoints, contracts, side effects, state transitions,
   risk surfaces, and validation targets with `review-surface-map`.

   If the map identifies at least three substantially independent runtime
   surfaces, follow [large-diff-slices.md](large-diff-slices.md) once before
   Phase 1. Do not slice a diff merely because it has many files.

3. Load `review-guardrails`; record `review_started`, `baseline_diff`, and
   `scope_baseline` in the loop state.

4. Run the required review lenses before the first review phase:

   - `pr-rubbish-audit`: classify every changed file and flag unrelated churn,
     dangerous removals, generated drift, stale branch-history comments,
     accidental deletions, or unneeded refactors.
   - `improve-codebase-architecture`: check boundaries, ownership, dependency
     direction, public contracts, abstractions, testability, and whether any
     structural issue should be fixed in this PR.
   - `reducing-cognitive-load`: check for hidden protocols, duplicated or weak
     types, stringly typed data, dense branching, shallow helpers, and code that
     makes future maintainers reverse-engineer the domain shape. Apply its
     plausibility and proxy tests to changed defensive code and one-use helpers.
   - `typescript-discipline`: evaluate whether the diff has TypeScript
     production code, API/client contracts, schemas, exported functions, typed
     React code, or type-system escape hatches. If none, record `not
     applicable`. If present, unsafe boundary types, duplicated domain types,
     unjustified assertions, weak runtime narrowing, and contract drift are
     actionable findings and should be fixed at the narrowest useful boundary.

   Also consider this Fowler smell baseline on the Standards path. Repo
   standards override the baseline, tooling-enforced issues should be skipped,
   and every smell is a judgment call rather than a hard violation:

   - Mysterious Name: a name does not reveal what it does or holds.
   - Duplicated Code: the same logic shape appears in more than one hunk or
     file.
   - Feature Envy: code reaches into another module's data more than its own.
   - Data Clumps: the same fields or params travel together repeatedly.
   - Primitive Obsession: a primitive or string stands in for a domain concept.
   - Repeated Switches: the same conditional cascade recurs on the same type.
   - Shotgun Surgery: one logical change forces scattered edits.
   - Divergent Change: one file or module changes for unrelated reasons.
   - Speculative Generality: abstraction appears without a current need.
   - Message Chains: callers navigate through a chain they should not know.
   - Middle Man: a class or function mostly delegates onward.
   - Refused Bequest: an implementation ignores most of what it inherits.

5. Add conditional review lenses only when their trigger is present:

   - `test-audit`: mandatory when the PR touches code with nearby or related
     tests, or when the PR changes, adds, or deletes tests. Check both whether
     related tests should change and whether changed tests earn their keep,
     especially around removed APIs, impossible states, implementation details,
     or branch-local history.
   - `frontend-ui-validation`: mandatory when the diff changes visible UI,
     layout, styling, routes/screens, interaction states, loading/error/empty
     states, responsive behavior, or screenshots would materially prove the
     change.
   - `review-animations`: mandatory when the diff materially changes animation,
     transitions, gestures, springs, or interaction timing.

6. Build a neutral risk checklist for `cold-pr-review-until-clean` from the
   changed-surface map and required/conditional lenses. Include checklist
   topics, not prior findings, desired conclusions, implementation rationale, or
   earlier review results.

7. Note validation commands needed for affected surfaces: package scripts for
   tests, typecheck, lint, build, UI/E2E, migrations, security, or generated
   artifacts.

8. Propose durable context updates only when the diff changes long-lived project
   facts and the update is evidence-backed.
