---
name: design-technical-diagrams
description: 'Create or refine architecture, lifecycle, sequence, trust-boundary, decision, threat-model, SVG, or HTML diagrams that explain system relationships. Do not use technical diagrams as product runtime or UI proof.'
---

# Design technical diagrams

Deliver one diagram that makes a system relationship clear at its destination
size, plus the rendered evidence that it communicates. Default to one view;
ask before producing a set answering different questions. Keep the artifact and
handoff concise without omitting required facts.

Define claim, reader, destination size/medium, current or target state, facts to
show, and details better left in prose. Trace real actors, systems, inputs,
stores, decisions, changes of state, outputs, authority boundaries, and feedback.
Use one actor's action or decision per primary step, grouped by owning system/phase.

Choose topology before decoration. Read [visual-system.md](references/visual-system.md),
sketch two or three spatially different low-detail layouts, and select for
thumbnail clarity. Equal boxes imply equal roles. Render a wireframe with real
short labels, realistic proportions, correct arrows, and icon space; fix an
unclear start, focal system, decision, feedback route, or outcome now.

Load `speak-fking-english` before copy is frozen. Use concrete actors/actions/objects,
define needed terms in place, and reserve body text for facts geometry/grouping/
route labels cannot communicate. Apply existing product type/palette, search
repo and installed icon assets first, pair icons/colour with text, and use open
connector gutters. Include chrome or legends only when the destination needs them.

Make visual acceptance part of delivery: [quality-gate.md](references/quality-gate.md)
requires whole-frame, destination-size, close-detail, responsive-width, and every-
export inspection. Optional [svg-linting.md](references/svg-linting.md) supports
dense hand-authored SVG after composition works. Convert feedback to observable
checks, fix source, rerender, and repeat affected passes until all pass or the
user accepts an exception. Do not add a generic verification round or verifier agent.

The diagram explains; it does not prove product execution or UI correctness.
Keep actual screenshots, recordings, requests/responses, and runtime observations
separate and label the diagram `What this explains`, never `What this proves`.
Lead with the export, claim, source, destination-size evidence, responsive/export
checks, and limitations. Lint counts alone cannot establish communication.
Use [diagram-page.html](assets/diagram-page.html) only for an explicitly requested
standalone page and do not inherit sample topology/chrome for embedded diagrams.
