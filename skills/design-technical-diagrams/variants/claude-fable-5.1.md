---
name: design-technical-diagrams
description: 'Create or refine architecture, lifecycle, sequence, trust-boundary, decision, threat-model, SVG, or HTML diagrams that explain system relationships. Do not use technical diagrams as product runtime or UI proof.'
---

# Design technical diagrams

Create a picture that explains one system relationship clearly at its destination
size. A technical diagram is explanation, not proof that a product ran or that
its UI works. Keep actual screenshots, recordings, requests/responses, and runtime
observations separate. Label the diagram `What this explains`, never `What this proves`.

1. State the claim, reader, destination size and medium, current/target state,
   required facts, and details that can stay in prose. Default to one diagram.
   Ask before creating multiple views that answer different questions.
2. Trace real actors, subsystems, inputs, stores, decisions, changes of state,
   outputs, authority boundaries, and feedback. Batch independent source reads.
   Give each primary step one actor's action or decision and group it under its owner.
3. Read [visual-system.md](references/visual-system.md). Sketch two or three
   low-detail layouts with different spatial arrangements. Select the clearest
   central relationship at thumbnail size. Use equal boxes only for equal roles.
4. Render a wireframe with realistic node proportions, real short labels,
   correct arrow directions, and icon space. Inspect it. Redesign if the start,
   focal system, decisions, feedback, or outcome is hard to locate.
5. Load `speak-fking-english` before freezing visible copy. Use concrete actors,
   actions, and objects, defining necessary technical terms in place. Add body
   copy only for facts not conveyed by position, grouping, or connector labels.
6. Use product typography/palette where available. Search repo assets and
   installed icon packages before drawing. Pair icons/colour with text, leave
   open connector gutters, and add chrome or a legend only if the destination needs it.
7. Read [quality-gate.md](references/quality-gate.md). Inspect the whole frame,
   destination size, zoomed detail, required responsive widths, and every export.
   Use optional [svg-linting.md](references/svg-linting.md) for dense hand-authored
   SVG only after composition works. Geometry checks do not replace the picture.
8. Convert feedback to observable checks, edit source, rerender, and repeat
   affected visual passes. Finish when all checks pass or the user accepts an exception.

Lead with the diagram/export and give the claim, source, destination-size evidence,
responsive/export checks, and remaining visual limits. During long work, report
changed evidence or direction. Copy [diagram-page.html](assets/diagram-page.html)
only for an explicitly requested standalone page; do not reuse its sample layout
or surrounding chrome for an embedded diagram.
