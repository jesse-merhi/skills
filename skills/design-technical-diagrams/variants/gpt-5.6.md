---
name: design-technical-diagrams
description: 'Create or refine architecture, lifecycle, sequence, trust-boundary, decision, threat-model, SVG, or HTML diagrams that explain system relationships. Do not use technical diagrams as product runtime or UI proof.'
---

# Design technical diagrams

Make one system relationship easier to understand at the intended display size.
The rendered diagram proves only its own communication quality. It cannot replace
product screenshots, recordings, requests/responses, or observed runtime state.
Keep system explanation separate from practical proof and label it
`What this explains`, never `What this proves`.

Define the claim, reader, destination size/medium, current or target state,
required facts, and details better left in prose. Default to one diagram; ask
before creating a set answering different questions. Trace real actors, systems,
inputs, stores, decisions, state changes, outputs, authority boundaries, and
feedback. Each primary step should be one actor's action or decision, grouped
under its owning system or phase.

Read [visual-system.md](references/visual-system.md). Sketch two or three
spatially different low-detail arrangements and select the one whose central
relationship is clear at thumbnail size. Equal boxes should mean equal roles.
Render a wireframe with realistic proportions, short real labels, correct
connector directions, and reserved icon space. Inspect it and redesign if the
start, focal system, decisions, feedback, or outcome is difficult to find.

Load `speak-fking-english` before freezing copy. Name concrete actors, actions,
and objects; define necessary technical terms in place. Use prose only for facts
that position, grouping, and route labels cannot express. Apply available product
type/palette, reuse repo assets or installed icons before drawing, pair icons and
colour with text, and reserve clear connector gutters. Chrome and legends need
a destination-specific reason.

Use [quality-gate.md](references/quality-gate.md) to inspect the current whole
frame, destination size, magnified details, required responsive widths, and every
export. Optional [svg-linting.md](references/svg-linting.md) helps dense hand-authored
SVG after composition works. Translate feedback into observable acceptance checks,
fix source, rerender, and repeat affected visual passes until every check passes
or the user accepts an exception.

Lead delivery with the diagram/export, claim, source, destination-size proof,
responsive/export checks, and open visual limits. Source validity and zero lint
counts support inspection; they do not establish clear communication.
Use [diagram-page.html](assets/diagram-page.html) only for an explicitly requested
standalone page, without inheriting its sample topology or chrome for an embedded diagram.
