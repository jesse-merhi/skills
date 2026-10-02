# React Native and Expo motion

Read for native transitions, gestures, sheets, or animated feedback. Inspect the installed React Native, Expo SDK, navigation, Reanimated, and gesture packages first. Use their versions' APIs and existing configuration; this reference does not authorize adding dependencies.

## Choose the owner

Let the navigator own screen transitions and back gestures. Keep the platform's default transition unless the task needs another. Reuse an installed sheet or gesture component before implementing its recognizers, scroll coordination, and accessibility.

For a simple transform/opacity transition, React Native's `Animated` native driver may be enough. Use one driver consistently for a value. The native driver does not support layout properties; `useNativeDriver: true` is not a universal optimization.

When Reanimated and a compatible gesture library are installed, keep continuous gesture values in shared values and animated styles. Do not send every frame through React state or a JS callback. Send meaningful events such as a completed snap to application logic once, using the installed version's thread bridge.

## Drag, release, and interruption

Keep the element under the finger during a drag. On grab, cancel its settling animation and retain its current position as the offset. On release, choose a target from direction, distance, and velocity, then continue from the current value. If a second grab interrupts settling, start there rather than resetting to the old snap point.

This Reanimated 4 fragment goes inside the component. Connect `settle` to the existing gesture's release handler, using velocity in the same coordinate units per second as `offset`. Use the product's tested spring values; the values below illustrate a non-bouncy settle. Do not combine the stiffness/damping configuration with duration/dampingRatio configuration.

```tsx
const offset = useSharedValue(0);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: offset.value }],
}));

function settle(target: number, releaseVelocity: number) {
  'worklet';
  offset.value = withSpring(target, {
    stiffness: 300,
    damping: 30,
    overshootClamping: true,
    velocity: releaseVelocity,
    reduceMotion: ReduceMotion.System,
  });
}
```

Import these APIs from the installed `react-native-reanimated`; attach `animatedStyle` to its `Animated.View`. This is the settling part, not a complete sheet: the existing gesture owner still handles cancellation, multi-touch, bounds, and nested scrolling. Confirm retargeting and velocity continuity on the installed runtime.

## Layout, access, and feedback

Respect system reduced motion for both programmatic and entering/exiting animations. Use immediate or restrained alternatives while keeping state changes clear. Keep focus, accessibility labels/state, and a button alternative to drag-only actions. Decorative movement should not delay access to content.

Use the existing safe-area provider and consume an inset once at the edge that needs it. For a floating action, a typical offset is the product's bottom spacing plus `useSafeAreaInsets().bottom`; a bar already padded by its parent needs no second inset. Insets do not account for the keyboard.

Choose the app's existing keyboard avoidance strategy. `KeyboardAvoidingView` behavior and vertical offset depend on platform and surrounding headers; verify them with a scrollable form and the keyboard open. Avoid combining multiple keyboard controllers that each add the same offset.

For list entry/exit, keep stable item identity and reuse installed layout animation facilities. A recycled row should not replay an entrance on every scroll. Keep long lists responsive while animations run, and avoid unbounded stagger that delays the final items.

## Check on both platforms

Exercise press, rapid reopening, interrupted settling, back swipe, nested scrolling, cancellation, rotation, keyboard, larger text, screen readers, and reduced motion. Inspect slow playback for jumps, then normal speed for response. A simulator can show layout and flows; use a physical device when gesture feel or performance matters, and state any missing device evidence.

Primary checks, 2026-09-30: [React Native native-driver limits](https://reactnative.dev/docs/animations#using-the-native-driver), [Reanimated 4 spring options](https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/), [Expo Reanimated compatibility](https://docs.expo.dev/versions/latest/sdk/reanimated/), [safe areas](https://docs.expo.dev/versions/latest/sdk/safe-area-context/), and [keyboard avoidance](https://reactnative.dev/docs/keyboardavoidingview).
