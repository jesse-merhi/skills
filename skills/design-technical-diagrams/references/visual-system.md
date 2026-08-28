# Technical diagram visual system

## Surface

Design the diagram before the page around it. Embedded exports should contain
the map or workflow plus only the title and boundary labels needed to read it.
Do not add a hero, claim banner, outer showcase card, legend, warning strip, or
decorative background by default.

## Topology and hierarchy

- Place the focal subsystem where it can own the composition.
- Put inputs beside the boundary they enter and outputs beside the system that
  produces them.
- Group related operations inside their real subsystem, lane, or phase.
- Place decisions, persistence, review, and terminal outcomes at the real
  handoff point.
- Draw feedback as geometry.
- Vary node size and treatment by semantic role.

At thumbnail size, the reader should see the focal system, start, major groups,
feedback, and outcome. Repair the layout before adding copy or decoration when
those are not visible.

## Canvas and grouping

Use a consistent spacing unit, then correct optically. Shared dimensions help
nodes with the same role; they should not force unrelated content into equal
cards. Let content determine height when fixed sizing creates empty space or
overflow. Shorten copy, compact local groups, widen useful rows, or move
support closer before adding decorative fill.

Number primary actions only when a stable sequence helps discussion. Inputs,
stores, notes, and enclosing products do not become steps merely because they
appear between actions.

## Connectors

Prefer simple orthogonal routes and short local connections.

- Reserve routing gutters before placing nodes.
- Attach each route to the correct source and destination.
- Put labels beside one clear segment in the direction of travel.
- Keep unrelated routes separate; share a trunk only for genuinely shared
  meaning.
- Cross at right angles in open space when crossing is unavoidable.
- Leave enough straight shaft for the arrival direction and arrowhead to read.
- Keep route CSS from leaking into marker or icon paths.

Feedback usually needs two distinct directions. Do not describe a loop that the
reader cannot trace.

## Type, colour, and icons

Use sentence case and a small hierarchy: region, primary action, short support,
quiet detail. Prefer concrete verbs and objects over labels such as
“Processing,” “Governance,” or “State.” Repeat an artifact's name when a pronoun
would make a route ambiguous.

Use a restrained semantic palette derived from the product when possible.
Colour reinforces labels and grouping; it is never the only meaning. Use
official marks for named products and one coherent icon family for generic
concepts. Pair every icon with text.

## Responsive layout and export

Keep semantic reading order in the source. A narrow layout may stack or regroup
the same story but must not change it. Keep branches next to decisions and
support next to the action it serves.

Keep editable source separate from generated exports when the artifact will be
maintained. Open each exported file independently and verify crop, fonts,
icons, routes, labels, and readability at its destination size.
