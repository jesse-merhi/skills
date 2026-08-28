# Interaction and motion

Design and implement motion that communicates feedback, state change, spatial
continuity, or an interaction's physical model. Remove motion that delays
frequent work or exists only as decoration.

1. Name the motion's purpose and frequency.
2. Preserve spatial origin, direction, enter/exit symmetry, and the user's
   current rendered state when an interaction is interrupted.
3. Give pressable controls immediate feedback. Keep ordinary transitions brief
   and tune duration and easing against distance, frequency, and product tone.
4. For gestures, track the pointer directly, preserve velocity across handoff,
   and use resistance beyond natural boundaries.
5. Prefer `transform` and `opacity` for frequent motion. Use layout, filters,
   clipping, or JavaScript-driven animation when they improve the interaction,
   then measure the result.
6. Preserve keyboard, focus, touch, screen-reader, and reduced-motion behavior.
7. Test normal speed, rapid repetition, interruption, reversal, reduced motion,
   and representative device performance.

For motion opportunities, read
[motion-opportunity-audit.md](motion-opportunity-audit.md). For complex gestures,
read [gesture-design.md](gesture-design.md). When the effect is hard to name,
read [animation-vocabulary.md](animation-vocabulary.md).
