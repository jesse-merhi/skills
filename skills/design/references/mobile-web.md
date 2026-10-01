# Mobile web

Read for phone websites, PWAs, full-screen layouts, sheets, or touch problems. Match the symptom before applying a fix; a document and an app with internal scroll containers need different behavior.

## Viewport, safe areas, and keyboard

Keep zoom available. For an edge-to-edge app, use:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

Use `dvh` when a shell should track expanding browser chrome; `svh` gives a stable size that fits with chrome visible, often useful for a hero. Keep the layout usable when content exceeds that size. Dynamic viewport units do not promise keyboard avoidance.

For example, a shell with its own scroll region can use the following. Replace spacing with product tokens. `min-height: 0` lets the middle grid row shrink and scroll instead of pushing the footer out. The fallback supports browsers without dynamic units.

```css
.app {
  height: 100vh;
  height: 100dvh;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
}
.app-content { min-height: 0; overflow-y: auto; }
.app-header { padding-top: env(safe-area-inset-top, 0px); }
.app-footer {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
}
```

Apply horizontal insets too when landscape content can reach a cutout. Count each inset once: avoid padding the shell and its child bar for the same edge.

When the keyboard opens, browsers can resize the visual viewport, the layout viewport, or overlay both. `interactive-widget=resizes-content` requests both viewports to shrink in browsers that support it; it does not make Safari adopt the same policy. Choose it deliberately for the target app, rather than adding it to every page. Check focused inputs and submit actions with the keyboard open. Safe-area padding is not keyboard padding. Prefer a scrollable form and the browser's focus scrolling; add visual-viewport handling only for an observed fixed-overlay problem, preserving pinch zoom and cleaning up listeners.

## Touch and scroll

Gate decorative hover behind capability, not screen width or user-agent detection. Hybrid devices need both touch and pointer interaction. Keep focus and press feedback outside the hover rule.

```css
@media (hover: hover) and (pointer: fine) {
  .action:hover { background: var(--surface-hover); }
}
.action { touch-action: manipulation; }
```

Use `:active` for immediate feedback; keep action commitment on normal activation. If a drag needs custom handling, declare the permitted browser gestures on that surface before it begins. A custom horizontal carousel can use `touch-action: pan-y pinch-zoom`, preserving vertical page scrolling and pinch zoom. Prefer native overflow and scroll snap for a simple carousel. Avoid `touch-action: none` on ordinary content.

Use `overscroll-behavior: contain` on a sheet's scrolling content when its boundary should not scroll the page behind it. Suppress root pull-to-refresh only if it conflicts with the app's intended gestures. Preserve ordinary document scrolling; do not use blanket `touchmove` cancellation.

Keep copyable text selectable. Restrict `user-select: none` to controls or drag handles that need it. If removing the tap highlight, replace it with visible press feedback. For input zoom problems, check the actual mobile font size before changing zoom settings; readable inputs commonly use at least 16 CSS pixels on iOS, scaled upward with the user's text preferences.

## Device proof

Inspect browser chrome expanded/collapsed, keyboard opening/closing, rotation, inset placement, scrolling boundaries, focus, and zoom. Check standalone mode too if the PWA targets it. Emulation helps with layout but does not prove keyboard behavior or touch feel. Use available physical hardware; report exactly which checks remain unproven when it is unavailable.

Primary checks, 2026-09-30: [viewport units](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length), [keyboard resize policies](https://developer.chrome.com/blog/viewport-resize-behavior), [WebKit safe areas](https://webkit.org/blog/7929/designing-websites-for-iphone-x/), and [touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action).
