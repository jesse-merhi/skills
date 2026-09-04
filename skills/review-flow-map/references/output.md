# Output

Use short sections:

- `Review Basis`: requested outcome and preserved obligations, with sources for
  material expectations. Distinguish explicit requirements, supported inferences,
  and unresolved questions. Include intentional contract changes and material
  source conflicts; omit boilerplate when the basis is straightforward.
- `Review Order`: the best sequence to read the PR.
- `Review Slices`: when there are at least three substantially independent
  runtime flows, propose two to four bounded discovery slices. For each,
  name its entrypoints, flow boundary, shared contracts, and overlap with other
  slices. Otherwise say `not needed`.
- `Flow Map`: the changed-flow summary. Changed flows with entrypoints,
  important symbols, and downstream consumers.
- `Contracts`: schemas, types, env vars, permissions, APIs, or persistence rules
  touched.
- `Risk Areas`: places likely to hide bugs, including stale state,
  permissions, concurrency, migrations, retries, cleanup, or external IO.
- `Validation Targets`: focused commands, tests, UI validation proof, or manual
  checks for the important flows, tied to an input/state and expected observable
  result. Say what was actually checked and what remains missing, stale, or
  unexecuted; do not present a plan as passing proof.
- `Finding Leads`: suspected issues to inspect next, clearly marked as unproven
  until checked.

When a file is only a leaf test, fixture, generated artifact, or style change,
say what upstream behavior it validates or mirrors.
