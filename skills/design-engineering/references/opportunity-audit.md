# Animation opportunity audit

Use this read-only mode when the user asks what could animate or how to make an
interface feel more alive. Find the few moments where motion would improve
feedback, continuity, state understanding, or delight. Do not modify source
code. For defects in existing motion, use `review-animations`.

## Gate every candidate

Reject a candidate as soon as one gate fails:

1. **Frequency:** keep constant or expert actions instant; restrain frequent
   actions; allow ordinary motion for occasional panels and more expression
   only for rare first-run, empty, success, or celebration moments.
2. **Purpose:** require feedback, spatial continuity, state indication,
   prevention of a jarring change, explanation, or rare delight. "It looks
   cool" is not a purpose.
3. **Speed:** use project tokens. Starting ranges are 100–160ms for press
   feedback, 125–200ms for tooltips or small popovers, 150–250ms for dropdowns,
   and 200–500ms for modals, drawers, or sheets.
4. **Function:** movement must help the user understand or act. Decoration on
   dense functional data usually hinders.

## Sweep

Identify the framework, motion library, existing tokens, product personality,
and interaction frequency. Then inspect:

- pressable controls without visible feedback;
- conditional content, accordions, or list changes that snap;
- anchored panels disconnected from their trigger;
- enter and exit paths with conflicting spatial stories;
- gesture-driven elements with hard stops or no settling model;
- rare completion, empty, onboarding, or success moments rendered flat.

Search code as evidence, but inspect the rendered experience when available.
When it is unavailable, state the uncertainty.

## Describe survivors

Each surviving opportunity needs exact properties, values, duration, easing,
interruptibility, and a reduced-motion path, drawn from the project when
possible. Prefer `transform` and `opacity` for frequent motion, small entrance
scales such as `0.95–0.98`, trigger-aware origins, coherent enter and exit
directions, and hover effects only on hover-capable pointers.

Return at most five to seven opportunities for a whole application and fewer
for one view:

| # | Location | Today | Purpose | Frequency | Suggested motion |
| --- | --- | --- | --- | --- | --- |
| 1 | `Toast.tsx:41` | Toasts appear instantly | Prevent a jarring change | Occasional | Enter and exit from the same edge using the existing toast easing |

Then include two to five deliberate rejections and name the failed gate. If
nothing survives, say so. Conclude with how much motion the interface needs and
the single highest-leverage opportunity.
