---
name: design-technical-diagrams
description: 'Create or refine architecture, lifecycle, sequence, trust-boundary, decision, threat-model, SVG, or HTML diagrams that explain system relationships. Do not use technical diagrams as product runtime or UI proof.'
---

# Design technical diagrams

Complete the requested diagram and its rendered verification. Batch independent
source reads and geometry checks. During long rendering work, report only a
change in evidence or direction. Use literal labels and short explanatory
sentences. Keep edits and generated assets limited to the requested diagram.

Make one system relationship easier to understand as a picture. Inspect the
rendered artifact to prove that the diagram itself communicates at its
destination size; source validity and geometry checks only support that claim.

## Evidence boundary

A technical diagram explains actors, systems, decisions, handoffs, state, or
sequence. It does not prove that the depicted system ran or that a user
interface looks or behaves correctly. Never use a diagram, wireframe, or mockup
in place of actual product screenshots, recordings, requests, responses, or
observed runtime state. When a PR needs both a system explanation and practical
proof, deliver them as separate artifacts and label the diagram as
`What this explains`, never `What this proves`.

## Workflow

1. Define the diagram contract.

   Record the claim, reader, destination size and medium, current or target
   state, facts that must appear, and details that can remain prose. Default to
   one diagram. Ask before producing a set whose views answer different
   questions.

2. Trace the real system.

   Identify actors, subsystems, inputs, stores, decisions, state changes,
   outputs, authority boundaries, and feedback. A primary step should express
   one actor performing one action or decision. Group related steps inside the
   system or phase that owns them.

3. Choose topology before styling.

   Read [visual-system.md](references/visual-system.md). Sketch two or three
   low-detail arrangements that differ spatially, then choose the one that makes
   the central relationship obvious at thumbnail size. Equal boxes imply equal
   roles; use them only when that is true.

4. Render a wireframe.

   Use realistic node proportions, short real labels, actual connector
   directions, and reserved icon space. Inspect the picture. Redesign if the
   start, focal system, decisions, feedback, or outcome is hard to locate.

5. Write for the named reader.

   Load `speak-fking-english` before freezing visible copy. Name concrete
   actors, actions, and objects. Define technical terms in place when the reader
   must learn them. Use body copy only for facts position, grouping, and route
   labels cannot carry.

6. Apply the visual system.

   Use the product's type and palette when available. Search repository assets
   and installed icon packages before drawing new icons. Pair icons and colour
   with text. Reserve open gutters for simple, correctly directed connectors.
   Add page chrome or a legend only when the destination genuinely needs it.

7. Validate the current render.

   Read [quality-gate.md](references/quality-gate.md). Inspect the whole frame,
   destination size, magnified detail, required responsive widths, and every
   export. For dense hand-authored SVG, optionally use
   [svg-linting.md](references/svg-linting.md) after the visual composition
   works.

8. Resolve feedback against fresh evidence.

   Translate each comment into an observable acceptance check, fix the source,
   rerender, and repeat the affected visual passes. Finish only when the current
   render passes every check or the user accepts an exception.

## Deliver

Lead with the diagram or export. Name the claim, source, destination-size proof,
responsive/export checks, and any open visual limitation. Do not present a zero
linter count as evidence that the diagram communicates well.

Copy [diagram-page.html](assets/diagram-page.html) only for an explicitly
requested standalone page. Do not inherit its sample topology or surrounding
chrome for embedded diagrams.
