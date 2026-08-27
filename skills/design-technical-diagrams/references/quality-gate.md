# Diagram quality gate

## Contents

- Semantic check
- Wireframe check
- Visual pass 1: whole composition
- Visual pass 2: destination size
- Visual pass 3: magnified detail
- Visual pass 4: responsive and export
- Automated assistance
- Feedback regression
- Completion evidence

The rendered picture is the primary evidence. Browser measurements and geometry
checks support the review; they do not replace it.

## Semantic check

Before styling, trace the content skeleton without consulting decorative copy.

- Is this the one diagram the user asked for?
- What single claim or reader question does it answer?
- Does every prominent item help answer that question?
- Are actors, systems, inputs, outputs, stores, and decisions accurate?
- Can the named reader explain every visible role, object, and state without
  reading source code or recovering prior conversation?
- Does each numbered title name the concrete actor, action, and object, or ask
  one question whose subject is explicit?
- Does role shorthand name its scope, such as the skill a person owns or the
  proposal a reviewer decides?
- Does each numbered action have one actor and one action, decision, or
  observable state change?
- Are related atomic actions grouped inside their real subsystem or phase?
- Are supporting inputs and dependencies shown as support rather than promoted
  into equal primary stages?
- Are every branch and feedback direction correct?
- Can the reader see where important state originates and where it persists?
- Does the terminal outcome match the real authority boundary?
- Are any labels smoother than the implementation evidence permits?

Read only the diagram title, region headings, numbered titles, branch labels,
route labels, and terminal outcomes. Point at every noun and explain what it
means as the named reader. They should explain the main story without body copy.
Any noun that requires guessing fails this check even when the implementation
team considers it obvious.

## Wireframe check

Render a low-detail wireframe with realistic node proportions. Do not continue
to colour and polish until the screenshot passes.

Look for:

- one obvious focal system, path, or relationship;
- inputs placed beside the system they feed;
- related work grouped locally rather than stretched into a long poster;
- downstream review, state, and enforcement placed by the real handoff;
- visible feedback geometry;
- variable node size that reflects role and content;
- simple outgoing routes with enough open space for labels;
- a start, important decisions, and outcomes visible within a few seconds;
- deliberate use of the available width and height.

Ask what can be removed, regrouped, widened, or moved before asking what can be
decorated.

## Visual pass 1: whole composition

Fit the complete diagram into the viewport. At first, ignore small words and
judge the picture.

### Hierarchy

- Does the focal subsystem or primary path dominate?
- Do region sizes and contrast match their importance?
- Are inputs, annotations, stores, and tools visibly quieter?
- Does every box look equally important? If so, the hierarchy has failed.
- Does the feedback loop remain visible at thumbnail size?

### Canvas use

- Is there a large empty gutter beside dense content?
- Is one tall card stretching an entire boundary?
- Are fixed card heights creating blank lower halves?
- Are there long connector-only bands between useful regions?
- Is a lower or later flow unnecessarily constrained to the width of an earlier
  subsystem?
- Is surrounding page chrome consuming space the diagram needs?
- Is the visible ink optically centred, not merely numerically centred?

Repair the structure. Widen useful rows, compact local grids, allow
content-driven heights, move support closer to its owner, shorten labels, and
reduce route bands. Do not fill empty space with legends, banners, shadows, or
decorative backgrounds.

### Flow and grouping

- Does the primary direction remain obvious?
- Do boundaries enclose the right operations?
- Are parallel operations arranged as a local group?
- Do connectors leave the correct source and enter the correct destination?
- Are independent routes kept independent where a shared trunk would obscure
  their meaning?
- Do arrows take simple routes instead of ornamental detours?

Save a screenshot of this pass. A clean DOM or SVG report is not evidence that
the composition passes.

## Visual pass 2: destination size

View the diagram at the exact width and medium where the reader will receive
it. For a pull-request image, inspect the image at pull-request width rather
than its 2× export dimensions.

- Can the reader identify the start, focal system, key handoffs, feedback, and
  outcome without zooming?
- Can a cold reader paraphrase every primary title and route label without
  asking what an unnamed role or internal state means?
- Are primary titles readable and short enough to scan?
- Is body copy readable without becoming the visual texture of the diagram?
- Do route labels clearly belong to one line?
- Are icons recognizable and paired with text?
- Are node padding, baselines, and icon alignment consistent within each
  family?
- Does every chip, label, icon, and body block remain inside its owning card,
  with a bottom inset that looks comparable to the top and side padding rather
  than merely staying one pixel inside?
- Does the diagram feel calm and information-rich rather than sparse, cramped,
  or card-heavy?
- Does the crop contain the diagram rather than unnecessary page furniture?

If text is too small, reduce nonessential copy or change the topology. Do not
increase the export resolution and pretend the destination became readable.

## Visual pass 3: magnified detail

Inspect at roughly 2×:

- text touching borders or connector labels;
- accidental text-to-text or text-to-icon collisions;
- one-pixel marker nubs, detached arrowheads, or arrowheads rendered as hollow
  chevrons because connector CSS leaked into the marker path;
- arrowheads that consume most of a short route, or turns whose final segment
  is too short to show the arrival direction;
- double-stroked or visually merged parallel lines;
- routes tracking box borders closely enough to look like the border;
- crossings hidden beneath text or icons;
- uneven padding, baselines, node heights, or region insets;
- corrupted icon fills or strokes;
- cropped shadows, strokes, markers, or glyphs;
- labels that are technically near a route but visually float.

Judge painted edges, not only path centrelines or bounding boxes.

## Visual pass 4: responsive and export

For responsive HTML, inspect the repository's intended breakpoints. When no
destination-specific sizes exist, use:

- 390 × 844;
- 768 × 1024;
- 1440 × 900.

At each size:

- inspect the full-page screenshot;
- confirm there is no horizontal panning for the primary story;
- confirm branches remain immediately after their decisions;
- confirm support remains attached to the action or subsystem it serves;
- inspect wrapping, clipping, gutters, and vertical rhythm;
- check the console and document overflow;
- ensure a responsive rearrangement has not changed the meaning.

Open each exported PNG, SVG, PDF, or slide by itself. Check the crop, background,
fonts, icons, arrows, labels, and destination-size readability. The default
embedded export should contain only the diagram and its necessary internal
context.

## Automated assistance

Use browser layout measurements for HTML to find overflow, clipped containers,
sibling overlaps, and console errors. Always inspect the corresponding
screenshot; measurements can flag harmless long-page continuation and can miss
bad hierarchy or wasted space.

For dense hand-authored inline SVG, optionally use
[svg-linting.md](svg-linting.md) to look for suspicious collisions, route
geometry, clipping, or missing definitions. Run it after the visual topology
works. Treat its output as a review queue.

Do not:

- expand a checker to understand arbitrary SVG merely to certify one diagram;
- weaken a detector to silence a visible problem;
- describe zero automated findings as visual proof;
- spend more time supporting exotic SVG behavior than inspecting the diagram;
- skip a visual pass because the output was generated deterministically.

## Feedback regression

Keep a ledger from the first review:

```text
feedback | observable acceptance check | evidence or current status
```

Good acceptance checks name visible behavior:

- “Pipeline inputs run down the left side.”
- “The four internal pipeline actions form a balanced 2×2 group.”
- “The input stack and pipeline boundary have comparable height.”
- “The lower workflow uses the available width rather than preserving an empty
  left gutter.”
- “Both outgoing decisions have clean independent routes.”
- “Connector-only vertical space is shorter.”
- “The export contains the workflow without surrounding page chrome.”

After any semantic change, rerun the semantic check. After any copy, layout,
route, icon, font, or sizing change, replace stale screenshots and repeat the
affected visual passes. Preserve earlier checks so later improvements do not
reintroduce old problems.

## Completion evidence

Report what the reader experiences:

```text
Claim: <one sentence>
Rendered: <diagram-only export and editable source>
Visual: focal system, primary path, feedback, and outcome read at thumbnail and destination size.
Canvas: no unexplained dead gutters, forced empty card space, or long connector-only bands.
Detail: icons, labels, arrows, padding, and routes inspected at 2×; <open findings>.
Responsive: <sizes inspected>; <real warnings or exceptions>.
Export: attachment opened standalone; crop and destination-size text verified.
Feedback: <resolved>/<total> ledger rows pass against the current render.
Automation: <supporting browser or optional SVG checks>; not used as aesthetic proof.
```

Lead with the artifact and the visual result, not test output.
