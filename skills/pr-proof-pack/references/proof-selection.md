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

- **UI or interaction:** use matched screenshots for a static visual change and
  a concise recording for motion or a manual interaction. Use text for changed
  labels, accessibility output, or textual state when appearance is not the
  claim.
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
ran. Let `speak-fking-english` decide whether the final explanation needs a
diagram or other support. Do not use a diagram, diff, or screenshot of prose as
proof of runtime behavior.
