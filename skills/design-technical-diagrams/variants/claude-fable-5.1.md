---
name: design-technical-diagrams
description: 'Create clear system diagrams with readable labels and deliberate layout.'
---

# Design technical diagrams

Explain one system relationship at the size the reader will actually see. Establish the audience, question, destination width, and facts from the current code or documentation. Keep technical explanation separate from runtime proof.

Prefer a layout engine over hand-positioning boxes and connectors. For Graphviz, write a small DOT graph and use the installed `dot` through:

```sh
skill-render-diagram flow.dot --output-dir <new-directory> --width 960
```

The helper sizes nodes, routes edges, writes SVG plus an HTML preview and source copy, and rejects labels that would become too small at the requested width. Use `--direction LR` for a left-to-right flow. An existing Mermaid or project-native renderer is also fine.

Keep labels short and concrete. Group by real ownership or phase, reserve connector space, and use restrained product colours. If a graph is crowded, change direction, shorten labels, or split the explanation by reader question rather than shrinking everything. Ask before expanding the requested scope into multiple diagrams.

Open the actual export at its destination width. Check label readability, clipping, overlap, arrow direction, route crossings, and whether the main path is obvious. Inspect requested narrow layouts separately; a large desktop export is not mobile proof. Fix the diagram in a loop until there are no issues.

Deliver the diagram, editable source, inspected size, and any remaining limitation. The diagram may have a title, but do not add too much surrounding content - the diagram should explain itself.

## References

- [DOT syntax example](assets/flow.dot): For Graphviz, start from this only as a syntax example, not a topology to copy.
- [Layout and checks](references/layout-and-checks.md): For custom SVG, styling, or automated geometry checks, use this guidance.
- [Diagram page](assets/diagram-page.html): Use only when a standalone page is requested.
