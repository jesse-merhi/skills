# Proof Selection

Every PR needs visual evidence. Start by choosing the screenshot that makes the
main behavioral claim easiest to see. Then add the smallest supporting proof a
reviewer needs to reproduce or reason about it.

## Required Screenshot

Choose at least one reviewer-visible screenshot for every PR:

- **UI change:** capture each distinct changed UI state from the running app.
- **Terminal, backend, infrastructure, or test change:** capture a focused
  command and the readable result that proves the behavior or check.
- **Documentation change:** capture the rendered document when presentation or
  comprehension changed; otherwise capture focused validation output.
- **API change:** capture a concise request and response or a focused contract
  test result, while retaining the copyable request and response in the body.

A screenshot is the required visual representation. It does not replace
copyable commands, expected results, or reproduction steps.

## Required Diagram for Complex Behavior

Use an understandable diagram when a reviewer would otherwise reconstruct any
of these from code:

- a workflow with several steps;
- a state transition or decision path;
- an API, service, queue, job, or integration boundary;
- permission or access decisions;
- dedupe, cleanup, migration, retry, or lifecycle behavior;
- interaction among three or more actors or components.

The diagram explains the behavior. The screenshot proves observed evidence.
Most non-trivial PRs need both.

Use an API example or a small before/after table in addition when exact values
matter, such as response shapes, ranking, counters, flags, permissions, or
persisted state.

Do not use a generic net-diff table as proof. File groups and implementation
buckets make the reviewer reconstruct the behavior instead of seeing it.
