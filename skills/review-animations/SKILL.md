---
name: review-animations
description: 'Review changed animation, transition, gesture, spring, or motion code for purpose, timing, easing, coherence, interruption, performance, reduced motion, and input behavior. Use as a focused code-review lens.'
---

# Review Animations

Review motion as interaction behavior, not decoration. Report only actionable
findings that affect feel, comprehension, responsiveness, accessibility, or
runtime performance.

## Scope

- Review the changed motion surface and its trigger, enter, steady, interrupt,
  reverse, and exit states.
- Keep general code correctness outside this skill unless it directly changes
  the animation's behavior.
- Do not implement fixes unless the user requested implementation.
- Read [references/standards.md](references/standards.md) before finalizing
  findings. Treat its numbers as defaults that may be overridden by measured
  product or platform evidence.

## Review Order

1. **Purpose and frequency:** Does the motion communicate feedback, state,
   continuity, or explanation? Is its intensity appropriate for how often it
   runs?
2. **Input response:** Does visual feedback start immediately? Can repeated or
   keyboard-driven actions remain fast?
3. **Spatial model:** Do origin, direction, continuity, and enter/exit paths
   explain where content came from and where it went?
4. **Interruptibility:** Can rapid input, reversal, dismissal, or gesture
   handoff continue from the current visible state?
5. **Timing and easing:** Do duration, curve, and sequencing suit the distance,
   purpose, and product personality?
6. **Performance:** Does the implementation avoid unnecessary layout, paint,
   style recalculation, and main-thread work? Is any claimed problem supported
   by the property and runtime involved?
7. **Accessibility:** Is reduced motion supported without losing required state
   feedback? Are focus, keyboard, touch, and screen-reader semantics preserved?
8. **Cohesion:** Does the motion belong to the component and the rest of the
   product?

## Finding Discipline

For each finding include:

- severity and a concrete title;
- `file:line` evidence;
- the user-visible behavior;
- why it matters in this interaction;
- the narrowest useful fix.

Do not file a finding only because a value differs from the reference defaults.
Do not require motion where instant state change is clearer. When the review is
clean, say so without inventing polish work.

## Verdict

Conclude with one of:

- **Block:** motion materially delays input, breaks spatial continuity,
  prevents interruption, causes avoidable jank, or ignores required reduced
  motion.
- **Needs follow-up:** motion is usable but has actionable craft or performance
  defects.
- **Approve:** no actionable motion findings remain.

This skill adapts Emil Kowalski's animation-review guidance. See
[references/upstream-license.md](references/upstream-license.md).
