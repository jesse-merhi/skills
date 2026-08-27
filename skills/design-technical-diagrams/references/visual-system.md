# Technical diagram visual system

## Contents

- Diagram surface
- Topology and hierarchy
- Numbering and grouping
- Canvas use and density
- Connector routing
- Typography and labels
- Colour and icons
- Responsive layout and export

## Diagram surface

Design the diagram before designing a page around it. For an image embedded in
a pull request, document, wiki, or slide, export only the workflow or map plus
the minimum title or boundary labels needed to understand it.

Do not add these by default:

- a hero heading outside the diagram;
- a claim banner;
- an outer showcase card;
- a legend for already labelled colours or icons;
- a warning or takeaway strip that repeats a visible terminal state;
- decorative gradients, blobs, shadows, or empty margins;
- comparison or status badges.

Those elements consume the same pixels needed for readable systems, routes,
and labels. Add one only when the destination lacks that context and the
element materially helps the reader.

## Topology and hierarchy

Start with spatial relationships, not a list of steps.

- Put the focal subsystem where it can own the composition.
- Put its inputs beside the boundary they enter, often as a quiet vertical
  stack down one side.
- Group related internal operations inside the subsystem. A compact 2×2 or 3×2
  grid often explains parallel or paired work better than a long row.
- Put review, persistence, policy updates, or terminal outcomes below or beside
  the subsystem according to the actual handoff.
- Draw feedback in the layout. Do not describe a loop that the geometry hides.
- Let downstream stages widen across the available canvas when they no longer
  belong to a narrow input or subsystem lane.

Vary size and treatment by role. A system boundary, a major durable artifact,
a human decision, and a supporting input should not look like four identical
cards. Equal boxes imply equal weight and the same semantic role.

At thumbnail size the reader should see the focal system, the start and end,
major groups, and any feedback loop. If the picture looks like equally weighted
boxes scattered on a canvas, repair the hierarchy before copy or decoration.

## Numbering and grouping

Number actions when a stable sequence helps the reader discuss the diagram.
The sequence may cross regions and node families; all numbered items do not
need equal dimensions or a single row.

Keep an action atomic when combining it would hide an actor change, an
intermediate output, or a decision. Then group related atomic actions inside
their real subsystem or phase instead of promoting each to a top-level panel.

Do not number:

- an input merely because it feeds a numbered process;
- a store or ticket merely because the process writes it;
- a legend, note, or region heading;
- a product label that represents the boundary around several actions.

Numbered titles and branch labels should tell the main story without body copy.
Use a short phase or action word beside a number when it helps orientation,
such as `1 · Observe`, `6 · Record`, or `9 · Approve`.

## Canvas use and density

Use an 8 px base unit, then correct optically. Starting values:

| Element | Starting value |
|---|---:|
| diagram outer inset | 16–24 px |
| subsystem/region inset | 20–28 px |
| descriptive node padding | 16–20 px |
| node gap | 16–24 px |
| long connector gutter | 24–40 px |
| icon optical size | 22–30 px |
| icon-to-label gap | 8–10 px |

Treat these as composition findings:

- a large unused gutter beside dense content;
- a boundary stretched by one unnecessarily tall input or description;
- fixed equal heights that leave empty lower halves in sibling cards;
- long bands containing only connector lines;
- a narrow lower flow that could use the width above or beside it;
- body text shrunk because surrounding chrome took the available space;
- a card whose padding is more prominent than its content.

Fix structure first. Shorten nonessential descriptions, allow content-driven
height, compact a local grid, widen the useful row, move support closer to the
stage it serves, or shorten connector bands. Do not hide poor space use by
cropping tightly or adding decoration.

Sibling nodes should share dimensions only when they play the same role and
carry comparable content. Align baselines, icons, and padding within a node
family, but allow different families to have different shapes and sizes.

## Connector routing

Prefer simple orthogonal routes with clear arrowheads. A reader should see
where a route begins, what it carries, and where it ends without tracing around
unrelated boxes.

- Reserve gutters before placing nodes and labels.
- Route inputs directly into the subsystem they feed.
- Drop a transition straight down or carry it straight across when the topology
  permits; avoid ornamental bends.
- Keep connector-only bands short.
- Keep long parallel routes visually separate from one another and from box
  borders.
- Put route labels beside one open segment, not floating between several lines.
- Keep arrowheads attached, correctly directed, and clear of nearby text.
- Scope connector CSS to the connector elements or classes. Never use a
  descendant `path` selector that can also restyle paths inside SVG markers.
  In the rendered export, confirm every arrowhead keeps its intended solid
  fill and does not become a hollow chevron or inherit the connector stroke.

Use a shared trunk only when the destinations genuinely share one source and
meaning. Independent outcomes, updates, or decisions may need two complete
lines. Do not merge them merely to reduce the path count.

When several destinations do share one transition, branch once from a visible
trunk rather than drawing coincident paths on top of each other. When a crossing
is unavoidable, cross at 90 degrees in open space.

Feedback needs both directions. For example, draw “sends feedback” from the
reviewer to the proposal and “updates the review tickets” from the proposal
back to the record. Keep them visually distinct and attach each label to its
own route.

## Typography and labels

Use the product's installed typeface when available and licensed, with system
fallbacks. Use sentence case and a clear hierarchy:

- region or subsystem label;
- numbered action title;
- one short explanation when needed;
- quiet detail or outcome tags.

Write for the reader named in the contract, not for the implementation team.
Concise jargon is still jargon. A visible role must name what the person is
responsible for, an artifact must say what it contains or records, and a state
must say what changed. Do not make body copy repair an ambiguous title.

Prefer action titles such as “Identify apps from signing data” and “Create one
review ticket per app.” Avoid umbrella labels such as “Processing,”
“Governance,” or “AI role.”

Repair insider shorthand with concrete scope:

| Insider shorthand | Cold-reader label |
|---|---|
| Find the current manager | Find the person who owns or administers the skill |
| Recheck authority | Check that the person still controls the skill |
| Frozen baseline | Earlier traffic used for comparison |
| Refresh review state | Update the staff review without undoing its decision |

These examples show the test, not required wording. Preserve the real domain
meaning while naming enough of it for this reader.

Write transition labels in the direction of travel: “feeds the daily review,”
“creates the review tickets,” “assigns app review,” or “publishes merged
policy.” Repeat the concrete artifact name across adjacent routes instead of
switching to `it`, `this`, or a vague state.

Keep body copy short enough to scan. A card is not the place for every true
field or caveat. Use bullets only when the list itself is the important output,
such as the contents of an evidence-backed case.

Run a heading-only cold read before final layout. The title, region headings,
numbered titles, branch labels, route labels, and terminal outcomes must explain
who acts on what and why the flow continues or stops. If a noun needs prior
conversation to make sense, replace or define it.

Never make important text tiny to preserve a chosen layout. Change the layout.

## Colour and icons

Use a restrained semantic palette derived from the product when possible.
Typical roles:

- quiet neutral for context and inputs;
- product or active colour for the focal automated system;
- green for a permitted or human-approved outcome;
- amber for a proposal, unresolved decision, or draft state;
- red for a stopped or impossible path.

Colour should organize regions and outcomes, not decorate every card. Pair it
with labels, icons, borders, or line style. Skip a legend when the meaning is
already written on the diagram.

Use official marks for named products and one coherent semantic icon family
for generic concepts. Icons should speed orientation at a glance: system,
search, ticket, review, person, pull request, lock, or store. Pair every icon
with text. Do not repeat a logo on arrows or use tiny icons as filler.

## Responsive layout and export

Preserve semantic reading order in the source. A narrow layout should stack the
same diagram, not reveal a different story. Keep each branch immediately after
its decision and each support node near the action it serves.

Inspect at the destination width first. Then test representative narrow,
tablet, and desktop sizes when the deliverable is responsive. The primary story
must not require horizontal panning unless the user explicitly requested a
fixed wide technical canvas.

Keep a durable source/output split:

```text
diagram-source/       # editable HTML, SVG, Mermaid, JSON, or YAML
icons/                # local official assets when needed
build script          # deterministic generation when useful
index.html            # standalone render
exports/              # diagram-only PNG/SVG/PDF attachments
screenshots/          # reviewed viewport evidence
```

Open every exported attachment by itself. Confirm the crop contains the
diagram rather than page chrome, all icons and arrows survive export, text is
readable at the destination size, and the visible ink uses the frame well.
