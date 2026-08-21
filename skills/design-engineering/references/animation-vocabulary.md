# Animation vocabulary

Use this reverse lookup when the user describes an effect without knowing its
name. Lead with the most likely term, define it in one sentence, and offer at
most two close alternatives when the description is ambiguous.

## Entrances and sequence

- **Fade**: appear or disappear through opacity.
- **Slide**: enter, leave, or move along an axis.
- **Scale in**: grow slightly into place, commonly paired with opacity.
- **Reveal**: uncover content with clipping or masking.
- **Stagger**: start related items in a short sequence.
- **Orchestration**: coordinate several animations as one transition.

## Continuity and layout

- **Crossfade**: fade one object out while another fades in at the same place.
- **Morph**: transform one visible shape into another.
- **Shared-element transition**: preserve an element's identity while it moves
  and changes between views.
- **Layout animation**: animate an element from its previous measured layout to
  its new one.
- **Direction-aware transition**: reverse movement direction for backward
  navigation.
- **Origin-aware animation**: grow or move content from the control that
  triggered it.

## Gesture and physics

- **Drag**: move an object through direct manipulation.
- **Swipe to dismiss**: throw content away along a supported axis.
- **Rubber-banding**: resist movement beyond a boundary, then return.
- **Momentum**: continue motion using release velocity.
- **Spring**: settle through stiffness, damping, mass, or bounce rather than a
  fixed easing curve.
- **Interruptible animation**: redirect motion from its current visible state.

## Scroll and ambient motion

- **Scroll reveal**: trigger an entrance when content enters the viewport.
- **Scroll-driven animation**: bind progress directly to scroll position.
- **Parallax**: move depth layers at different rates.
- **Marquee**: loop content continuously along one direction.
- **Idle animation**: subtle autonomous motion while an element waits.

## Masks and effects

- **Clip-path reveal**: uncover content with a hard geometric clipping edge.
- **Mask reveal**: uncover content with a shape or soft gradient.
- **Line drawing**: animate an SVG path as though it is being drawn.
- **Number ticker**: roll or interpolate digits toward a new value.
- **Skeleton shimmer**: animate a loading placeholder's highlight.

## Easing terms

- **Ease-out**: start quickly and settle slowly.
- **Ease-in-out**: accelerate and then decelerate.
- **Linear**: move at constant speed.
- **Cubic-bezier**: define a custom timing curve.
- **Asymmetric easing**: accelerate and decelerate at different rates.

If no term matches, say that the effect is a combination of the nearest terms
instead of inventing a new name.
