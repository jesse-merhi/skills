# Motion review

Review existing motion as interaction behavior. Do not implement fixes unless
the user requests them.

Inspect purpose and frequency, input response, spatial origin and direction,
interruptibility, reversal, timing, easing, performance, reduced motion,
keyboard and touch behavior, and coherence with the product.

Report only actionable findings. Each finding includes severity, `file:line`
evidence, the visible behavior, why it matters in this interaction, and the
narrowest useful fix. A value differing from a reference default is not a
finding without a concrete effect.

Conclude with `Block`, `Needs follow-up`, or `Approve`.
