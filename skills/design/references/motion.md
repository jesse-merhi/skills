# Motion and gestures

Use the same principles when implementing motion, reviewing existing behavior, or suggesting opportunities. Reviews and suggestions do not authorize edits.

## Purpose and timing

Motion should explain feedback, state, spatial continuity, or direct manipulation. Keep repeated expert actions instant or restrained; occasional panels can move more, and rare celebrations can be expressive. Use the product's tokens and judge the actual interaction rather than enforcing universal durations.

Give controls immediate press feedback. Use ease-out for responses, coherent easing or springs between visible positions, and linear motion for constant progress. Avoid movement that delays the task or changes properties unintentionally.

## Continuity

Anchor menus and popovers to their trigger. Keep enter/exit and forward/backward directions coherent. Preserve an object's identity when moving between states. Start reversals from the current rendered value; cancel or retarget the existing animation rather than layering competing animations.

For gestures, preserve the grab offset, capture the active pointer, and track it directly. Derive release velocity from recent samples and carry it into settling. Combine velocity, direction, and distance when choosing snap points. Use increasing resistance beyond boundaries. Prevent nested scrolling and dragging from accidentally claiming the same movement.

## Implementation and access

Reuse installed animation and gesture tools. Prefer transform and opacity for frequent motion; measure layout, filter, clipping, or JavaScript-driven effects on representative devices when needed. Keep useful content visible if initialization fails.

Respect reduced motion, keyboard focus, touch, screen readers, and hover capability. Replace large travel, scale, parallax, or ambient repetition with restrained or immediate feedback without hiding state changes.

## Check the result

Exercise normal use, rapid repetition, interruption, reversal, cancellation, reduced motion, and relevant nested-scroll or multi-touch behavior. Use real hardware when gesture feel matters.

For findings, show the location, observed behavior, consequence, and narrow fix. For opportunities, explain where motion helps, how it behaves, and the reduced-motion alternative. Omit speculative decoration and arbitrary quotas of findings.
