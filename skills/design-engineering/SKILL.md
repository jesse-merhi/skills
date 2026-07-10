---
name: design-engineering
description: 'Implement and refine interaction craft: motion, animation, transitions, micro-interactions, component feel, press feedback, popovers, drawers, sheets, toasts, drag or swipe gestures, springs, easing, timing, and perceived performance. Use when UI behavior must feel responsive and physically coherent. For gesture physics or Apple-style fluidity, load references/apple-design.md; for naming an effect, load references/animation-vocabulary.md.'
---

# Design Engineering

Make interaction behavior feel immediate, coherent, and deliberate. Treat the
rules below as strong defaults; preserve product conventions and justify
exceptions with the interaction's purpose and measured behavior.

## Route The Task

- For drag, swipe, momentum, springs, rubber-banding, sheets, or interruptible
  gesture work, read [references/apple-design.md](references/apple-design.md).
- When the user describes an effect but does not know its name, read
  [references/animation-vocabulary.md](references/animation-vocabulary.md).
- For a dedicated review of existing motion code, use `review-animations`.
- For broad layout, typography, color, or page composition, use
  `frontend-design`; this skill owns the interaction layer.

## Decide Before Animating

1. Name the purpose: feedback, state change, spatial continuity, explanation,
   or preventing a jarring change.
2. Consider frequency. Repeated expert actions should be instant or extremely
   restrained; occasional and first-run moments can carry more expression.
3. Preserve the user's mental model. Enter and exit from related positions,
   anchor popovers to triggers, and keep direction consistent with navigation.
4. Choose the smallest motion that communicates the change.

Remove motion that delays a frequent action, competes with the task, or exists
only because the implementation supports animation.

## Timing And Easing

- Use immediate visual response for press and pointer-down feedback.
- Prefer ease-out for entering or responding elements, ease-in-out for objects
  already moving on screen, and linear motion only for constant progress.
- Keep ordinary interface transitions brief. Treat 100–250ms as the common
  range and exceed it only when distance, complexity, or deliberate user input
  earns the time.
- Make exits and system responses at least as fast as entries unless the user
  is intentionally holding or confirming an action.
- Tune values against the product's personality instead of applying one curve
  everywhere.

## Physical And Spatial Coherence

- Start from the element's current rendered value when an interaction can be
  interrupted.
- Preserve velocity when a gesture hands off to an animation.
- Use trigger-aware transform origins for anchored content; keep modal motion
  centered when the modal has no spatial trigger.
- Avoid entrances that collapse to nothing. A small scale change plus opacity
  usually preserves the object's perceived shape better than `scale(0)`.
- Let draggable content track the pointer directly, capture the pointer during
  drag, and apply resistance beyond natural boundaries.

## Component Feel

- Give pressable controls immediate feedback without changing layout.
- Avoid animating every property with `transition: all`; name the properties
  whose change matters.
- Keep tooltips and repeated navigation fast after the first interaction.
- Coordinate related values so opacity, position, size, and content do not land
  at visibly different times.
- Use stagger only when sequence improves comprehension; never block input
  while decorative items finish entering.

## Performance

- Prefer compositor-friendly `transform` and `opacity` for high-frequency
  motion.
- Use `filter`, `clip-path`, layout animation, or JavaScript-driven motion when
  they materially improve the interaction, then measure on a representative
  device instead of banning them categorically.
- Use CSS or WAAPI for predetermined motion and an interruptible animation
  system for gestures and dynamic targets.
- Avoid parent-level animated variables that force broad descendant style
  recalculation when a direct element update is sufficient.
- Test motion while the page is busy, not only in an isolated demo.

## Accessibility

- Honor reduced-motion preferences. Preserve useful state feedback while
  removing or reducing spatial movement.
- Gate hover-only motion to devices that actually hover.
- Keep focus, keyboard behavior, screen-reader state, and touch targets intact.
- Never hide required content behind an animation that may not run.

## Verify

Inspect the interaction at normal speed, slowed down, and under rapid repeated
input. Check interruption, reversal, enter/exit symmetry, reduced motion,
console errors, dropped frames, and real-device gesture behavior when relevant.

This skill adapts Emil Kowalski's design-engineering guidance. See
[references/upstream-license.md](references/upstream-license.md).
