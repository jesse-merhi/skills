# Output

Use short sections:

- `Review Order`: the best sequence to read the PR.
- `Flow Map`: changed flows with entrypoints, important symbols, and downstream
  consumers.
- `Contracts`: schemas, types, env vars, permissions, APIs, or persistence rules
  touched.
- `Risk Surfaces`: places likely to hide bugs, including stale state,
  permissions, concurrency, migrations, retries, cleanup, or external IO.
- `Validation Targets`: focused commands, tests, UI validation proof, or manual
  checks that would prove the important flows.
- `Finding Leads`: suspected issues to inspect next, clearly marked as unproven
  until checked.

When a file is only a leaf test, fixture, generated artifact, or style change,
say what upstream behavior it validates or mirrors.
