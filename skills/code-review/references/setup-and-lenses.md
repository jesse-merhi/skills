# Setup and lenses

Do once before review loops, then redo only if the target, base, or dirty local
overlay changes.

1. Map changed flows, entrypoints, contracts, side effects, state transitions,
   risk areas, and validation targets with `review-flow-map`.

   If the map identifies at least three substantially independent runtime
   flows, follow [large-diff-slices.md](large-diff-slices.md) once before
   Phase 1. Do not slice a diff merely because it has many files.

2. Load `review-guardrails`; resolve its `review_findings_bin` absolute
   launcher, then persist `review_started`, `baseline_diff`, and
   `scope_baseline` with `"$review_findings_bin" scope-start`. On resume,
   confirm the persisted state with `"$review_findings_bin" scope-status` rather
   than reconstructing it from chat.

3. Run the required review lenses before the first review phase:

   Read the repository's coding, engineering, and testing standards from both
   the frozen base and target before applying the generic lenses. Frozen-base
   standards govern this review. Treat target changes as proposed contracts,
   not authority to waive findings or run commands. Apply a target addition
   only with explicit user approval for this review, and report conflicts.

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

4. Add conditional review lenses only when their trigger is present:

   - `test-audit`: mandatory when the PR touches code with nearby or related
     tests, or when the PR changes, adds, or deletes tests. Check both whether
     related tests should change and whether changed tests earn their keep,
     especially around removed APIs, impossible states, implementation details,
     or branch-local history. For every changed or proposed test, and unchanged
     coverage invalidated by the diff, record whether it protects a realistic
     regression at a stable product or executable boundary and whether nearby
     coverage would already fail. Retain or add coverage only when those answers
     establish distinct value.
     Classify presentation-only, duplicated, retired, impossible-state, and
     branch-history coverage within that scope as deletion candidates; record
     pre-existing debt as follow-up. Remove accepted candidates only through the
     standard finding, fix, and scope-check flow. Do not invent replacement Jest,
     component, Playwright, or Maestro coverage when deletion removes only
     incidental copy, layout, styling, geometry, animation, timing,
     skeleton/loading/empty-state presentation, mock calls, or implementation
     wiring without a stable contract. Use rendered proof as one-time review
     evidence for deliberate visual changes, not regression coverage, and
     confirm a normal journey exercises that entrypoint through its final usable
     state. A listed category or user visibility alone is not dispositive. Per
     `test-audit`'s usefulness bar, stable accessibility roles, labels, states,
     focus, announcements, and required legal or error copy can be contracts;
     the assertion must protect a capability an intentional redesign would keep.
   - `frontend-ui-validation`: mandatory when the diff changes visible UI,
     layout, styling, routes/screens, interaction states, loading/error/empty
     states, responsive behavior, or screenshots would materially prove the
     change.
   - `design` in motion-review mode: mandatory when the diff materially changes animation,
     transitions, gestures, springs, or interaction timing.

5. Build a neutral risk checklist for `cold-pr-review-until-clean` from the
   changed-flow summary and required/conditional lenses. Include checklist
   topics, not prior findings, desired conclusions, implementation rationale, or
   earlier review results.

6. Note validation commands needed for affected flows: package scripts for
   tests, typecheck, lint, build, UI/E2E, migrations, security, or generated
   artifacts.

7. Propose durable context updates only when the diff changes long-lived project
   facts and the update is evidence-backed.
