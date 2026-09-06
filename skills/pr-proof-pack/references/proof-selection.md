# Proof selection

Start from the PR's main claim and select one or more pieces of evidence that lets a reviewer verify the claims easily. Tests, builds, CI, and validator runs are not considered easy to review evidence.

## Comparisons

Place the two outcomes next to each other and label them `Before <description of what happened before>` and `After <what happens now>`. Highlight the changed values or visible behavior.

Use text for a textual comparison and matched media for a visual comparison.

## Textual Evidence

If the evidence is text based e.g.
- commands and terminal output;
- requests, responses, logs, traces, and error messages;
- records, emitted events, queue state, configuration, and structured data;
- concise before/after values or state transitions.

Use a fenced block, a short request/response example, or a small Markdown table.

However if the text based content has important visual traits then consider visual evidence. e.g.
- appearance, spacing, hierarchy, responsive layout, or rendered output;
- motion, timing, gesture, transition, or interaction feel;
- a UI flow whose visible states and recovery matter;
- media rendering or playback;
- a trace, chart, or spatial comparison whose shape carries the result.

## Visual Evidence

Visual evidence is either in the form of image or video.

Inspect the images and play recordings before upload. Check that text is readable and actions are easy to follow.

Do not use diagrams in place of visual evidence.

## Choosing Evidence types

Combine evidence types when they prove different claims; omit captures that repeat what another example already shows.

- **UI or interaction:** use actual product screenshots for a static appearance, layout, responsive, or rendered-state change. But also include an edited recording for motion, timing, gesture, or a manual interaction.
- **API or backend:** show the representative request, response, and persisted or rejected state as copyable text.
- **Infrastructure, migration, worker, or scheduled job:** show the operator input and resulting resource, record, delivery, cleanup, or rollback.
- **Test-only:** demonstrate the product behavior the test protects.
- **Performance:** provide matched measurements with environment, method, and sample size. Use a table for exact values and a chart or trace only when its shape reveals information the table cannot.

## Workflow based evidence

When a PR introduces or materially changes a system or workflow, you may also load `design-technical-diagrams` and include a diagram.

Place the diagram before the practical proof and introduce it with what the reviewer should learn.
