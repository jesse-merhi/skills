# Web motion and gestures

Use these principles when implementing motion, reviewing behavior, or suggesting opportunities. Reviews and suggestions do not authorize edits.

## Purpose and timing

Motion should explain feedback, state, spatial continuity, or direct manipulation. Keep repeated expert actions instant or restrained; occasional panels can move more, and rare celebrations can be expressive. Use product tokens and judge the actual interaction rather than enforcing universal durations.

Give immediate press feedback; commit the action through the control's normal activation so dragging away can cancel and keyboard activation still works. Ease-out is a useful starting point for responses; coherent easing or a spring can connect visible positions, and linear motion suits constant progress. Do not wait for an entrance to finish before accepting input.

## Pick the smallest suitable tool

| Need | Start with |
| --- | --- |
| Hover, press, colour, or class-controlled state | CSS transitions on named properties |
| First-render entry, supported target browsers | CSS transitions with `@starting-style` |
| Predetermined sequence or decorative loop | CSS keyframes, with reduced-motion behavior |
| Programmatic pause, seek, or reversal | Web Animations API (`element.animate()`) |
| Momentum, coordinated layout/exit, or gesture values | Existing animation/gesture library, using its installed API |

Prefer transform and opacity for frequent motion. CSS and WAAPI do not guarantee compositing; browser, property, and effect determine the work. Measure layout, filters, clipping, and JavaScript-driven effects on representative devices when needed. Do not install a library for a fade or change an installed library's API from memory.

## Entry without a mount effect

This example starts a newly rendered notification slightly below its final position. Replace the illustrative duration, easing, and distance with the product's tokens. The visible state is the default, so unsupported browsers show the content immediately.

```css
.notice {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 180ms ease-out, transform 180ms ease-out;
}
@starting-style {
  .notice { opacity: 0; transform: translateY(0.5rem); }
}
@media (prefers-reduced-motion: reduce) {
  .notice { transition: none; }
  @starting-style {
    .notice { opacity: 1; transform: translateY(0); }
  }
}
```

Put the starting rule after the final rule so an equal-specificity rule does not override it. This recipe handles entry; exit requires keeping the element mounted until its exit completes, or using a supported discrete-transition/presence mechanism. Removing it immediately cannot animate its departure.

## Interruption and gestures

For a toggle, change the CSS target and let the transition continue from the rendered value. For WAAPI, keep one animation per controlled effect and reverse it when retracing the same path; do not create another entrance on every click. A different target needs an explicit retarget from the current presentation. Clean up owned animation handles when the element is removed.

For a drag, cancel settling when the user grabs the element, preserve the grab offset, capture the active pointer, and track it directly. Derive release velocity from recent samples and pass it using the installed spring's units. Combine velocity, direction, and distance when choosing snap points. Retain position and velocity through retargeting when the library supports it. Do not assume every spring wrapper does this automatically.

Use increasing resistance beyond boundaries. Keep enter/exit and forward/back directions coherent; anchor menus and popovers to their trigger using the positioning primitive's origin. Check pointer cancellation, an additional finger, and scroll-versus-drag ownership.

## Tooltips as a group

Reuse the installed tooltip primitive and its provider's delay/skip-delay controls. Delay the first hover to avoid accidental activation. While someone explores adjacent controls, show subsequent tips immediately; reset the delay after they leave the group. Skip the repeated entrance too where the primitive exposes that state. Keep this state within the group, not globally across unrelated UI.

Support keyboard focus, Escape dismissal, and the primitive's accessible description. Keep the tip visible when the pointer moves onto it. A tooltip contains descriptive text; interactive content needs a suitable popover/dialog primitive. Keep a control's accessible name and essential instructions available without the tooltip.

## Check the result

Exercise normal use, rapid repetition, interruption, reversal, cancellation, and reduced motion. Replace large travel, scale, parallax, or ambient repetition with restrained or immediate feedback without hiding state changes. Respect focus, touch, screen readers, and hover capability.

Inspect coordinated properties in slow motion or frame by frame to catch jumps, drifting origins, and mistimed exits; return to normal speed to judge responsiveness. Use real hardware when gesture feel matters. For findings, show observed behavior, consequence, and a narrow fix. For opportunities, explain the purpose and reduced-motion alternative; omit decoration quotas.

Primary checks, 2026-09-30: [starting styles](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style), [WAAPI reversal](https://developer.mozilla.org/en-US/docs/Web/API/Animation/reverse), [W3C tooltip behavior](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/), and [hover/focus content](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html).
