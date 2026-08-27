# Optional rendered-diagram checks

Use the checker only after the diagram works visually. It catches a small set
of objective rendering failures that can be easy to miss at normal size. It
does not judge composition, hierarchy, spacing, centring, route length, copy,
or whether the diagram explains the right thing.

## Run

```sh
node <skill-dir>/scripts/check-rendered-diagram.mjs <output.html>
```

The checker opens the real page in installed Chrome at mobile, tablet, and
desktop widths. It uses one Chrome process and a separate browsing context for
every file and viewport. Repeat `--viewport WIDTHxHEIGHT` to use destination
sizes instead. Pass several HTML files in one command when checking fixtures or
related exports.

Mark the diagram root with `data-diagram="true"`. Mark standalone inline icons
with `data-icon="true"` so their decorative paths are treated as one icon.

Optional route metadata enables endpoint and unrelated-node checks:

```html
<rect id="source" data-node="true" ... />
<rect id="target" data-node="true" ... />
<path id="source-to-target"
  data-route="source-to-target"
  data-from="source"
  data-to="target"
  ... />
```

Do not add metadata merely to satisfy the checker. A simple diagram can rely on
the required visual passes.

## What it checks

- horizontal overflow and clipping;
- duplicate IDs and broken local SVG references;
- broken `<use>` elements and failed HTML images inside `<foreignObject>`;
- overlapping nodes or text;
- text leaving the SVG bounds or colliding with another node;
- routes passing through text, icons, or unrelated nodes;
- missing declared route nodes and visibly detached endpoints;
- visible SVG ink leaving the diagram bounds.

Each unique problem is printed once with every affected viewport. A zero-error
run means only that these mechanical checks passed. It does not mean the
diagram looks good.

## What the agent must inspect

Use the whole-frame, destination-size, 2x-detail, and responsive/export passes
for everything that depends on judgment, including:

- hierarchy, balance, density, centring, and use of the canvas;
- padding, alignment, visual rhythm, and readable type size;
- short, awkward, doubled, crossing, or crowded routes;
- label clarity and whether labels sit naturally beside their routes;
- arrowhead shape, direction, marker nubs, and unusual SVG features;
- curves, transforms, masks, clip paths, nested SVG, and percentage geometry.

Do not add lint rules for those concerns. Inspect the rendered artifact and fix
what a reader would actually experience.

## Checker changes

When modifying the checker, run:

```sh
node <skill-dir>/scripts/test-diagram-linter.mjs
```

The test exercises clean and broken diagrams at two viewports in one Chrome
process. Add a rule only for an objective, reachable rendering failure that is
harder to catch reliably with the required visual passes.
