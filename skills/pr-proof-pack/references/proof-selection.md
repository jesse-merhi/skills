# Proof Selection

Every PR needs visual evidence of the implementation working in practice. Start
from the main behavioral claim and capture a reviewer performing or observing
that behavior. Automated validation only supports this proof.

## Evidence Is Behavior, Not Validation

The following remain in the check run and never satisfy `Visual proof`. Do not
repeat routine pass lists in the PR body:

- test output or pass counts;
- build, CI, coverage, lint, type-check, or validator output;
- green checkmarks or workflow dashboards;
- code, diffs, diagrams, or an agent-written description of expected behavior.

Choose practical evidence by change type:

- **UI or interaction:** upload a deliberately paced video of the manual flow
  from starting state through interaction, transition, and outcome. Also capture
  every distinct changed end, empty, loading, error, and recovery state.
- **API or backend:** exercise a real representative request and show the
  response plus the resulting persisted state, emitted event, or absence of an
  invalid side effect.
- **Infrastructure, migration, worker, or scheduled job:** perform the operator
  action or realistic dry run and show the resulting state, resource, record,
  delivery, cleanup, or rollback behavior.
- **Documentation:** show the rendered document being followed to accomplish the
  changed task, or show the exact rendered comprehension improvement.
- **Test-only:** demonstrate the product behavior the test protects in the
  running system. The new test itself remains a supporting check.
- **Performance:** show comparable before/after traces, recordings, charts, or
  user-visible timing, and add a Markdown table with the same environment,
  dataset, scenario, measurement method, and sample size.

Every PR still needs at least one uploaded screenshot. Interactive UI changes
also require the video; static states cannot prove an interaction.

## Required Diagram for Complex Behavior

Use an understandable diagram when a reviewer would otherwise reconstruct any
of these from code:

- a workflow with several steps;
- a state transition or decision path;
- an API, service, queue, job, or integration boundary;
- permission or access decisions;
- dedupe, cleanup, migration, retry, or lifecycle behavior;
- interaction among three or more actors or components.

The diagram explains the behavior. The screenshot or recording demonstrates
observed behavior. Most non-trivial PRs need both.

Use an API example or a small before/after table in addition when exact values
matter, such as response shapes, ranking, counters, flags, permissions, or
persisted state.

Do not use a generic net-diff table as proof. File groups and implementation
buckets make the reviewer reconstruct the behavior instead of seeing it.
