---
name: design-technical-diagrams
description: 'Create or refine architecture, lifecycle, sequence, trust-boundary, decision, threat-model, SVG, or HTML diagrams that explain system relationships. Do not use technical diagrams as product runtime or UI proof.'
---

# Design technical diagrams

Explain one system relationship clearly in a rendered artifact. Resolve the
reader and destination from supplied context when practical and choose routine
layout details locally. Ask when a remaining choice changes the explanation or scope.

## Establish what the diagram claims

Record claim, reader, destination size/medium, current or target state, required
facts, and details left to prose. Default to one diagram; a set whose views answer
different questions needs user agreement. Trace actors, subsystems, inputs, stores,
decisions, state changes, outputs, authority boundaries, and feedback. Use one
actor/action or decision per primary step, grouped inside its owning system/phase.

A diagram explains the system; it does not establish product runtime or UI behavior.
Do not replace screenshots, recordings, requests/responses, or observed state
with a diagram, mockup, or wireframe. Deliver practical proof separately and
label this artifact `What this explains`, never `What this proves`.

## Make the relationship visible

Read [visual-system.md](references/visual-system.md). Produce two or three
spatially different low-detail sketches and select for thumbnail clarity. Equal
boxes imply equal roles. Render a wireframe using real short labels, realistic
proportions, correct arrows, and reserved icon space. Redesign unclear starts,
focal systems, decisions, feedback, or outcomes before styling.

Load `speak-fking-english` before freezing copy. Name concrete actors/actions/objects
and define needed terms in place. Let position, grouping, and route labels carry
facts before adding body prose. Reuse product type/palette and existing repo or
installed icons, pair icons/colour with text, and reserve open connector gutters.
Only add destination-needed chrome or legends.

## Prove the current artifact communicates

Apply [quality-gate.md](references/quality-gate.md) to whole-frame, destination-size,
magnified-detail, required responsive-width, and every-export inspection. Optional
[svg-linting.md](references/svg-linting.md) supports dense hand-authored SVG after
composition works. Turn feedback into observable checks, edit source, rerender,
and repeat affected passes. Finish when current checks pass or the user accepts
an exception; these required visual passes remain even when extra checking is unnecessary.

Deliver the diagram/export with claim, source, destination-size evidence,
responsive/export checks, and open limits. Zero lint counts are not communication
proof. Use [diagram-page.html](assets/diagram-page.html) only for an explicitly
requested standalone page, not as a source of topology or chrome for embedded diagrams.
