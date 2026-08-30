# Proof selection

Start from the PR's main claim and choose the smallest evidence form that lets a
reviewer verify it without translating formats. Practical evidence shows the
real behavior. Tests, builds, CI, and validators support that evidence but do
not replace it.

## Prefer native evidence

Use copyable text when the important facts are already textual:

- commands and terminal output;
- requests, responses, logs, traces, and error messages;
- records, emitted events, queue state, configuration, and structured data;
- concise before/after values or state transitions.

Use a fenced block, a short request/response example, or a small Markdown table.
Do not turn text into a screenshot. A screenshot makes the result harder to
copy, search, quote, and inspect without proving anything extra.

Use visual evidence only when text would lose an important part of the claim:

- appearance, spacing, hierarchy, responsive layout, or rendered output;
- motion, timing, gesture, transition, or interaction feel;
- a manual UI flow whose visible states and recovery matter;
- media rendering or playback;
- a trace, chart, or spatial comparison whose shape carries the result.

When visual evidence is necessary, use the smallest useful image or recording.
Read [screenshots.md](screenshots.md); for recordings, also read
[video-editing.md](video-editing.md). The model must inspect the actual pixels or
frames before upload; file metadata and successful rendering are not a quality
review.

An explanatory technical diagram is never practical evidence for the system or
workflow it depicts. It cannot replace actual product screenshots or recordings
and does not show that the depicted behavior ran. When rendered diagram or
export output is itself the changed product, capture that actual output as
visual proof of its own readability and export result.

## Show the break and fix

For a reproducible bug fix, use the same input and environment against the
direct base and PR branch. Put the two outcomes next to each other and label
them `Before: direct base` and `After: PR`. Include the failure point and
reason in the before result, then show the corrected outcome and important side
effect in the after result.

Use text for a textual comparison and matched media for a visual comparison.
Do not make reviewers infer the baseline from prose or compare mismatched
fixtures, viewports, inputs, or environments. If reproducing the base is unsafe
or impossible, state the constraint and show the closest honest boundary.

## Choose by change type

- **UI or interaction:** use actual product screenshots for a static appearance,
  layout, responsive, or rendered-state change. Match them to the direct base
  when that baseline is meaningful and reproducible; otherwise state the
  constraint and show the actual product entry point and outcome. Use a concise
  edited recording for motion, timing, gesture, or a manual interaction. When
  both the interaction and a static state changed, include both.
  Do not downgrade an interactive claim to screenshots or substitute a
  technical diagram to avoid recording it. Use text for changed labels,
  accessibility output, or textual state when appearance is not the claim.
  If required UI capture is unavailable, return `blocked`.
- **API or backend:** show the representative request, response, and persisted
  or rejected state as copyable text. Add a visual only when the response is
  itself rendered or spatial.
- **Infrastructure, migration, worker, or scheduled job:** show the operator
  input and resulting resource, record, delivery, cleanup, or rollback. Prefer
  a short text trace when those facts are textual; record the screen only when
  the visible operator flow matters.
- **Documentation:** quote the smallest changed instruction and show the result
  of following it. Use a screenshot only when rendered layout or appearance is
  the improvement.
- **Test-only:** demonstrate the product behavior the test protects.
  The test output remains a supporting check.
- **Performance:** provide matched measurements with environment, method, and
  sample size. Use a table for exact values and a chart or trace only when its
  shape reveals information the table cannot.

## Explanation is separate

An explanation visual teaches how something works; practical evidence proves it
ran. The two are independent requirements. When a PR introduces or materially
changes a system or workflow, load `design-technical-diagrams` and include one diagram.
When the same PR changes UI, include the required actual screenshots or
recordings as well.

Treat the PR as introducing or materially changing a system or workflow when
the product change adds or rewires a recognizable trigger, two or more actions
or participants, an important handoff, decision, or state change, and an
outcome. This includes a new service interaction, review or approval process,
job lifecycle, data path, control loop, or failure and recovery path. An
internal refactor with the same visible flow, a single configuration change, or
one isolated input and output does not qualify by itself.

The diagram should answer one reviewer question and show the workflow from a
recognizable trigger to its outcome. Include the real actors or systems, keep
each numbered primary step to one action or decision, and make important
handoffs, state, branches, and feedback visible. Use plain-language labels and
useful icons so a cold reviewer does not have to decode repository vocabulary.
Do not make several diagrams unless the user explicitly asks for them.

Place the diagram before the practical proof and introduce it with what the
reviewer should learn. Caption it `What this explains`, never `What this proves`.
Then provide separate observed evidence for the behavior. An explanatory
diagram, diff, or screenshot of prose is not proof of runtime behavior. Never
place an explanatory diagram in a `Before: direct base` or `After: PR`
practical-evidence slot. When rendered diagram output is itself the changed
product, its actual pixels may prove that output but not the depicted system.
