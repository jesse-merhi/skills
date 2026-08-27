---
name: design-technical-diagrams
description: 'Design, build, refine, and visually validate polished technical diagrams and explicitly requested diagram sets, including architecture maps, system and trust boundaries, lifecycle flows, sequence diagrams, decision flows, threat models, and branded inline SVG or standalone HTML. Use when a user asks to create or improve diagrams, turn prose or a design into a visual explanation, add useful icons, fix diagram layout or routing, or produce export-ready technical visuals.'
---

# Design technical diagrams

Make the system understandable as a picture. Let the real topology determine
the composition, use the available canvas deliberately, and judge the rendered
artifact with your eyes. Automated checks can expose defects; they cannot tell
you whether the diagram is clear, balanced, or worth looking at.

## Work in this order

1. Agree what the diagram must teach and where it will be seen.
2. Trace the real actors, systems, inputs, outputs, decisions, state, and
   feedback paths.
3. Sketch several low-detail spatial arrangements and choose the clearest one.
4. Render a wireframe with realistic proportions and inspect the picture.
5. Add final copy, icons, colour, and routes without changing the proven
   hierarchy.
6. Inspect the whole diagram, its real destination size, magnified detail, and
   responsive/exported forms.
7. Use browser measurements and optional geometry checks to investigate what
   visual inspection finds or might miss.
8. Resolve every user comment against a fresh render.

Do not spend time polishing a weak composition. Do not call a diagram good
because a checker returns zero findings.

## Agree the explanation

Default to exactly one diagram. Treat an explicit brief as the agreement;
otherwise recommend a concise contract and ask one compact confirmation
question.

Record:

- **claim:** the one idea or guarantee the picture should teach;
- **reader:** what they know and what they need to decide or understand;
- **destination:** the actual width, medium, and surrounding context;
- **must show:** the few relationships, actions, states, or boundaries that
  prove the claim;
- **omit:** true details that do not need spatial placement;
- **state:** current, target, or deliberately mixed.

Do not create a diagram set because the source is complicated. If a second
view would answer a different question, name that question and ask permission.

The default deliverable for an embedded document, pull request, or slide is
the diagram itself. Do not surround it with an oversized title card, claim
banner, outer showcase card, legend, warning strip, decorative background, or
comparison badge unless that element is needed in the destination. Use a
compact title inside the diagram only when the surrounding document will not
identify it.

## Model the system before drawing

Identify each item as one of:

- primary action, decision, state change, or outcome;
- subsystem or region that owns several related actions;
- input, dependency, external actor, or store;
- request, return, feedback, or control path;
- branch-specific action or terminal outcome;
- annotation.

The number of steps is not a quality target. A ten-step flow can be excellent
when the steps describe the real sequence and the composition groups them by
system. A four-card flow can be confusing when each card hides several actors
and handoffs.

Keep a primary step semantically atomic: one actor performs one action,
decision, or observable state change. Atomicity does **not** require every step
to become an equally sized top-level card. Group related steps inside their
real subsystem, phase, lane, or boundary. Put inputs beside the subsystem they
feed. Put stores, policies, and review tools beside the action that uses them.
Use size, grouping, position, and contrast to show importance.

For an ordered flow, number the primary actions when numbers make the sequence
easier to discuss. Numbering may continue across differently sized nodes and
regions. Do not number supporting inputs or stores merely because they appear
between actions. Read the numbered titles and branch labels without body copy;
they should still explain the sequence.

For a decision, ask one plain-language question and label every relevant case.
Show a real terminal outcome or rejoin. For stateful artifacts, show their
producer and destination instead of letting them appear inside a box without a
source.

## Choose topology, not a template

Read [references/visual-system.md](references/visual-system.md) before laying
out the diagram.

Sketch two or three arrangements using plain boxes and lines. Vary the actual
topology, not merely colours or card styles. Useful possibilities include:

- a focal subsystem with its inputs down one side and outputs below;
- a compact grid inside a system boundary, surrounded by quieter dependencies;
- a sequence of actor handoffs with explicit returns;
- a lifecycle with persistent state across phases;
- a decision flow with visible terminal branches;
- an architecture or trust map organized by ownership and containment;
- a control loop with the feedback route visible in the composition.

Choose the arrangement that makes the most important relationship obvious at
thumbnail size. Do not default to a row, column, or poster of identical cards.
Equal boxes imply equal roles; use them only when that is true.

Use the canvas. A large empty gutter, forced card height, long connector-only
band, or sparse decorative margin is a structural finding. Rebalance regions,
widen useful content, compact a local grid, shorten descriptions, or move a
supporting system closer to its owner. Do not fill dead space with chrome.

## Build a wireframe and look at it

Render a low-detail wireframe before final styling. Use approximate final node
sizes, short real labels, reserved icon slots, and actual connector directions.
Inspect the screenshot as a picture:

- Is the focal system or primary path obvious before reading?
- Do inputs, outputs, review, state, and feedback sit where their relationships
  make sense?
- Does the structure use the canvas without feeling cramped or sparse?
- Are related nodes grouped while support remains quieter?
- Are outgoing routes simple, direct, and attached to the correct source?
- Do independent transitions need independent lines rather than a shared trunk?
- Does the feedback loop read as geometry instead of explanatory prose?
- Are start, important decisions, and outcomes easy to locate?

Redesign the topology if any answer is unclear. A checker cannot rescue this
stage.

## Write for a cold reader

Load `$speak-fking-english` before freezing diagram copy. Give it the complete
visible copy and the reader defined in the diagram contract. A short label is
not clear when only an insider knows what its nouns mean.

Name the actor, action, and concrete object in the words the reader sees. For
every role, artifact, state, and condition, ask:

- Who or what is this?
- What does it own, change, carry, or decide here?
- Would the intended reader know that without source code, prior conversation,
  or body copy elsewhere in the diagram?

Rewrite any label that makes the reader guess. Prefer “Find the person who owns
or administers the skill” to “Find the current manager.” Prefer “Check that the
person still controls the skill” to “Recheck authority.” Prefer “Earlier
traffic used for comparison” to “Frozen baseline.”

Use an internal or technical term only when the reader must learn that exact
term. Define it in place on first use. Do not use role shorthand such as
`manager`, `owner`, `reviewer`, or `operator` without naming what the person
manages, owns, reviews, or operates when the scope is not already unmistakable.

Give each primary title one clear verb or question. Use body copy only for the
fact that cannot be expressed by position, grouping, route labels, or short
supporting text.

Before styling, read only the title, region headings, numbered titles, branch
labels, route labels, and terminal outcomes as the named reader. Point at every
noun and explain it from those visible words alone. If any explanation requires
guessing or recovering omitted context, rewrite and repeat the cold read.

Use icons as orientation anchors:

1. Search repository assets and installed icon packages first.
2. Use official product marks for named products when available.
3. Use one coherent semantic icon family for generic actors, actions, stores,
   and decisions.
4. Pair every icon with text and normalize by optical size.
5. Reserve icon space before routing; do not sprinkle tiny icons into finished
   cards as decoration.

Do not add a legend when the diagram is already labelled. Colour reinforces
meaning; it must not be the only explanation.

## Route deliberately

Reserve open gutters for connectors. Prefer simple orthogonal routes and short
local connections. Label meaningful transitions with concrete actions in the
direction of travel.

Avoid wonky detours, lines that track box borders, floating labels, long close
parallel runs, and unnecessary shared trunks. A shared trunk is useful only
when the routes genuinely share one source and meaning. When two independent
outcomes or updates leave a node, two complete routes may be clearer.

Make feedback visible. If a reviewer changes a proposal and an agent updates a
ticket or pull request, draw both directions and keep them visually distinct.
The arrowhead must agree with the action.

## Visually validate the render

Read [references/quality-gate.md](references/quality-gate.md) and perform its
visual passes. The required proof is the rendered artifact a person receives,
not the source and not a linter report.

After every material layout, routing, copy, font, icon, or sizing change:

1. **Whole frame:** fit the diagram in view and inspect hierarchy, balance,
   empty space, density, grouping, and the primary reading path.
2. **Destination size:** inspect at the actual width where it will be read.
   Important text must be readable without zooming.
3. **Magnified detail:** inspect around 2× for clipping, collisions, uneven
   padding, content escaping its card, broken icons, malformed or hollow
   arrowheads, arrowheads that consume the route, marker nubs, doubled lines,
   and off-by-a-few-pixels alignment.
4. **Responsive/export:** inspect required narrow layouts and open the exported
   PNG, SVG, PDF, or slide by itself.

For HTML, use the repository's browser tooling or
`frontend-ui-validation` when available. Measure overflow, clipping, and
console errors, but also inspect screenshots at each viewport. A clean layout
audit can coexist with a visibly poor composition.

For hand-authored inline SVG with dense freeform routing, run the optional
checks in [references/svg-linting.md](references/svg-linting.md) after the
visual composition works. Use them to find geometry that deserves inspection,
not to certify aesthetics or justify adding support for every SVG feature.

## Iterate from feedback

Keep a small ledger:

```text
feedback | observable acceptance check | evidence or current status
```

Turn “use the space better” into concrete checks such as “the input stack and
pipeline have comparable height,” “the large left gutter is gone,” and
“connector-only vertical bands are shorter.” Turn “get rid of the shit around
the diagram” into “the export contains only the workflow and the minimum
context needed to read it.”

Fix source, rerender, and inspect the same size again. Preserve earlier checks
through later revisions. Finish only when every row passes against the current
render or the user explicitly accepts an exception.

## Resource routing

- Read [references/visual-system.md](references/visual-system.md) before
  wireframing for hierarchy, canvas use, spacing, routing, typography, colour,
  icons, and export structure.
- Read [references/quality-gate.md](references/quality-gate.md) before final
  validation or whenever the composition feels unbalanced, cramped, sparse,
  confusing, visually generic, or dependent on insider language.
- Read [references/svg-linting.md](references/svg-linting.md) only for
  hand-authored inline SVG whose routes or text geometry warrant automated
  assistance, or when modifying the bundled checkers.
- Copy [assets/diagram-page.html](assets/diagram-page.html) only when the user
  requests a standalone showcase page. Do not inherit its surrounding chrome
  or sample topology for an embedded diagram.
