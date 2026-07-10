# Apple-Inspired Fluid Interaction

Load this reference for gesture-driven interfaces, springs, sheets, direct
manipulation, velocity, momentum, rubber-banding, and interruptible motion.

## Core Model

Make the interface respond like a continuous physical system:

1. Respond immediately to input.
2. Track direct manipulation one-to-one.
3. Animate from the current presentation value.
4. Carry release velocity into the settling motion.
5. Keep the animation interruptible and reversible.
6. Use resistance rather than hard stops at natural boundaries.

## Direct Manipulation

- Respond visually on pointer or touch down; commit the action according to the
  control's normal activation semantics.
- Preserve the grab offset instead of snapping the object under the pointer.
- Capture the active pointer so the gesture continues outside the element.
- Ignore additional touch points once a single-pointer gesture owns the object.
- Update visual position continuously during the gesture.

## Velocity And Momentum

- Track recent positions and timestamps rather than deriving velocity from one
  stale sample.
- Project where the object is going, then choose the destination from distance,
  direction, and velocity together.
- Hand the release velocity into the spring or decay animation so the seam is
  not visible.
- Use distance thresholds as a fallback, not the only dismissal signal.

## Interruptibility

- Allow input during transitions.
- Read the current rendered transform or animation value when reversing.
- Prefer springs or retargetable transitions for gestures that can change
  direction mid-flight.
- Cancel or redirect the existing animation instead of starting a second
  competing animation.

## Boundaries And Sheets

- Apply increasing resistance when dragging beyond a natural edge.
- Keep the sheet attached to the finger while dragging.
- Choose snap points from projected motion as well as current position.
- Keep background scale, overlay opacity, corner radius, and sheet position
  coordinated if they express one transition.
- Test nested scroll views and sheet gestures together; do not let both claim
  the same movement accidentally.

## Spatial Consistency

- Enter and leave along paths that explain where content came from.
- Use the trigger as the origin for anchored popovers and menus.
- Keep forward and backward navigation directionally consistent.
- Avoid dissolving an object that users expect to remain the same object across
  states; use a continuity or shared-element transition when it clarifies the
  relationship.

## Materials And Feedback

- Use translucency and depth to communicate hierarchy, not as decoration.
- Keep stacked translucent surfaces legible.
- Combine motion with sound or haptics only when the platform, product, and user
  settings support them.
- Match feedback strength to the significance of the action.

## Accessibility And Testing

- Provide a reduced-motion path with less travel and fewer scale changes.
- Test gestures on real hardware when practical; simulators do not reproduce
  touch velocity, friction, or haptics faithfully.
- Test cancellation, rapid reversal, multiple fingers, viewport edges, nested
  scrolling, and slow frames.

Adapt these ideas to the platform. Web examples may use Pointer Events, CSS,
WAAPI, or Motion; React Native work should use its established gesture and
animation stack rather than translating APIs literally.
