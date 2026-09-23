---
name: design-technical-diagrams
description: 'Create clear system diagrams with readable labels and deliberate layout.'
---

# Design technical diagrams

Establish the audience, question, destination width, and facts from current code or documentation. Explain one system relationship at that size; do not present explanation as runtime proof.

Prefer a layout engine over hand-positioning boxes and connectors. For Graphviz, write a small DOT graph and use the installed `dot` through:

```sh
skill-render-diagram flow.dot --output-dir <new-directory> --width 960
```

The helper sizes and routes the graph, writes SVG, HTML preview, and source, and rejects undersized labels. Use `--direction LR` for left-to-right flow. An existing Mermaid or project-native renderer also works.

Use short labels, real ownership or phase groups, connector space, and restrained product colours. For crowded graphs, change direction, shorten labels, or split by reader question rather than shrinking everything. Ask before expanding scope to multiple diagrams.

Inspect the export at destination width for readable labels, clipping, overlap, arrow direction, crossings, and an obvious main path. Check requested narrow layouts separately. Fix and inspect until no issues remain.

Deliver the diagram, editable source, inspected size, and limitations. Keep surrounding explanation brief.

## References

- [DOT syntax example](assets/flow.dot): For Graphviz, start from this only as a syntax example, not a topology to copy.
- [Layout and checks](references/layout-and-checks.md): For custom SVG, styling, or automated geometry checks, use this guidance.
- [Diagram page](assets/diagram-page.html): Use only when a standalone page is requested.
