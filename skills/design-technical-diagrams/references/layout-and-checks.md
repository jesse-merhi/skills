# Layout and checks

Keep the useful visual style: restrained colours, short action labels, clear ownership groups, and minimal surrounding chrome. Equal boxes should represent comparable roles, not force every label into the same dimensions. Let content set height and preserve internal padding.

Inputs belong near their entry boundary; stores and outcomes belong beside their owner. Place decisions at the actual branch point. Keep feedback visibly directional. Reserve routing gutters and use short local connections. Separate unrelated lines; share a trunk only when it represents shared meaning. If crossing is unavoidable, cross clearly in open space rather than over a node or label.

Inspect the whole picture, destination-size text, and magnified details. Check crop, padding, fonts, arrows, symbols, loop direction, and export readability. A high-resolution image cannot rescue text made too small by layout.

## Existing geometry checker

```sh
skill-check-rendered-diagram --viewport 960x900 <diagram.html>
```

Repeat viewport flags or pass multiple HTML files in one run. The installed Chrome checker reports clipping, text collisions, and broken SVG references. For hand-authored SVG, `data-node` on node shapes and `data-route`, `data-from`, `data-to`, and `data-label` on routes enable additional relationship checks.

Without that metadata, automated node/route coverage is limited. It does not judge the story or reliably count every line crossing. Inspect the rendered result even when counts are zero. Do not add metadata solely to obtain a green result.

Keep editable source and exports separate. Open each delivered format independently and disclose any size or format that could not be checked.
