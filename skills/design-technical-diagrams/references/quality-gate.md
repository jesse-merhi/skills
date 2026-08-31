# Diagram quality gate

Inspect the rendered picture, not only its DOM, SVG, or source.

## Semantic pass

- Does the diagram answer one stated reader question?
- Are actors, systems, boundaries, state, decisions, routes, and outcomes true?
- Can the named reader understand every prominent noun without prior chat or
  source-code knowledge?
- Does each branch terminate or rejoin, and does feedback point the right way?
- Can title, region headings, primary labels, route labels, and outcomes carry
  the main story without body copy?

## Wireframe pass

- Is one focal path or relationship obvious?
- Are related operations grouped by their real owner or phase?
- Are support, stores, and annotations quieter than primary actions?
- Are start, decisions, feedback, and outcomes easy to locate?
- Do connector gutters exist before final labels and icons are added?

Do not polish a wireframe that fails these questions.

## Whole-frame pass

Fit the entire diagram in view and inspect hierarchy, balance, density, and
reading direction. Repair large dead gutters, stretched boundaries, repeated
equal cards, long connector-only bands, and decorative furniture that crowds
the actual system.

## Destination-size pass

Inspect at the width and medium the reader will receive. Confirm primary text
is readable without zooming, labels belong to one route, icons remain
recognizable, and all content has visible interior padding. Change topology or
reduce nonessential copy when text is too small; export resolution is not a
substitute for readability.

## Detail pass

Inspect magnified areas for clipping, collisions, uneven padding, broken icons,
detached or malformed arrowheads, very short final route segments, doubled
lines, border-following routes, floating labels, and cropped strokes or glyphs.
Judge painted edges, not only path coordinates.

## Responsive and export pass

Inspect every required breakpoint. When none is specified, use one phone,
tablet, and desktop width appropriate to the destination. Preserve semantic
order, keep support beside its owner, and avoid horizontal panning unless the
user requested a fixed wide canvas.

Open every exported SVG, PNG, PDF, or slide by itself. Check crop, background,
fonts, icons, routes, labels, and destination-size readability.

## Automated assistance

Use browser measurements for overflow, clipping, overlaps, and console errors.
For dense inline SVG, use [svg-linting.md](svg-linting.md). Treat findings as an
inspection queue. Zero findings do not certify composition or clarity.

## Completion evidence

Report:

- claim and intended reader;
- editable source and final export;
- destination sizes inspected;
- semantic, whole-frame, detail, responsive, and export result;
- remaining limitations or accepted exceptions.
