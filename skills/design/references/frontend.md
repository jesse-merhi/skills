# Interface design

Choose the layout from the user's task and the information, not a favourite template. A work queue needs useful density and clear state; an editorial page may need a strong image and a reading rhythm.

Use real labels and plausible content early. Long names, empty sections, and errors often expose a weak layout sooner than polished placeholder cards.

Establish a small, coherent type and spacing system. Make the primary action obvious, related controls close, and secondary detail quieter. Keep decoration subordinate to the content.

In an existing product, use its components and tokens. For a new direction, draw from the subject's visual language and invest in one or two distinctive choices rather than styling every element loudly.

## Type that survives real content

Treat size, weight, line height, and tracking as a set. Keep body copy comfortable; tighter display headings may work, but check the actual font, language, and line breaks before tightening spacing. Use `font-optical-sizing: auto` when the chosen font has an optical-size axis; it cannot add one to a font that lacks it.

Use text and spacing tokens that accommodate larger text. Avoid fixed-height text containers. Check long labels, translated text, narrow screens, and zoom: an action must stay readable and reachable when a label wraps. Use tabular numerals for changing counters or aligned numeric columns when the font supports them.

## Materials and contrast

Use translucent surfaces when seeing underlying content helps explain a layer. Start with an opaque token background that is readable without blur; add translucency as an enhancement. Check it over busy images and both themes, not only a blank canvas. Avoid stacking translucent text surfaces whose combined background is unpredictable.

When supported, `prefers-reduced-transparency: reduce` can replace blur with a solid surface. Support is incomplete, so the ordinary fallback must also be legible. For `prefers-contrast: more` and forced colours, retain a visible boundary, focus indicator, and readable text; shadows and blur alone cannot identify controls.

For example, a floating toolbar uses the product's surface, text, and border tokens. If blur is unavailable or reduced transparency is requested, it becomes opaque while keeping the same controls and hierarchy. Animation of large filters needs device measurement; a static material may be sufficient.

## Access and inspection

Use semantic regions, headings, labels, and clear focus. Hover should supplement an action, never reveal its only affordance. Inspect the actual interface at relevant widths, in both themes, with larger text and keyboard interaction.

Primary checks, 2026-09-30: [W3C page structure](https://www.w3.org/WAI/tutorials/page-structure/), [text resizing](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [optical sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-optical-sizing), and [reduced transparency support](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-transparency).
