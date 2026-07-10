# Motion Review Standards

Use these as review defaults, then account for product conventions, platform
behavior, measured performance, distance, and interaction frequency.

## Purpose And Frequency

| Frequency | Default posture |
| --- | --- |
| Constant or expert repeated action | Instant or nearly imperceptible |
| Frequent navigation or hover | Restrained |
| Occasional modal, drawer, or toast | Standard transition |
| Rare onboarding or celebration | May carry more expression |

Valid purposes include feedback, state indication, spatial continuity,
explanation, and softening a necessary visual discontinuity.

## Timing

| Interaction | Common range |
| --- | --- |
| Press feedback | 80–160ms |
| Tooltip or small popover | 120–200ms |
| Dropdown or select | 150–250ms |
| Modal, drawer, or sheet | 200–500ms, depending on distance |

Treat 300ms as a useful warning point for ordinary controls, not a universal
ceiling. Long travel, deliberate holds, and explanatory motion may need more
time.

## Easing

- Entering or responding: strong ease-out.
- Moving between visible positions: ease-in-out or a suitable spring.
- Hover and color: standard ease.
- Constant progress: linear.
- Gesture settling: spring or decay that accepts release velocity.

Flag `ease-in` when it delays visible response, not merely because the token is
present.

## Physical Coherence

- Anchor popovers and menus to their trigger.
- Keep modals centered when they have no spatial trigger.
- Avoid `scale(0)` entrances for normal UI; preserve a visible object shape.
- Preserve direction between forward and backward navigation.
- Start interrupted motion from the current rendered value.
- Hand release velocity into gesture settling.

## Implementation

- Flag `transition: all` when it can animate unintended properties.
- Prefer `transform` and `opacity` for frequent motion.
- Accept `clip-path`, filters, layout animation, or JavaScript motion when the
  interaction needs them and representative-device measurement supports them.
- Prefer transitions, WAAPI, or interruptible animation primitives for targets
  that can change mid-flight.
- Avoid broad inherited variable updates when a direct element update is
  sufficient.

## Accessibility

- Reduce travel, scale, parallax, and repeated ambient motion under reduced
  motion.
- Preserve opacity, color, or instant state feedback when it aids
  comprehension.
- Gate hover motion to hover-capable pointers.
- Keep content visible when animation initialization fails or pauses.

## Verification

Check normal speed, slowed playback, rapid repeated input, reversal,
interruption, reduced motion, busy-main-thread behavior, and real-device
gestures when risk warrants it.
