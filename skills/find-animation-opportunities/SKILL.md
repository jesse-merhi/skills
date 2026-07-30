---
name: find-animation-opportunities
description: 'Inspect a UI or frontend codebase for places that would genuinely benefit from motion. Use when the user asks what could animate or how to make an interface feel more alive. Read-only: report precise opportunities and deliberate rejections; do not implement them.'
---

# Find Animation Opportunities

Find the few moments where motion would improve feedback, continuity, state
understanding, or delight. This is a filter, not an animation wishlist.

Do not modify source code. For implementation, hand a selected opportunity to
`design-engineering`. For defects in motion that already exists, use
`review-animations`.

## Gate Every Candidate

Record an answer to all four questions. Reject the candidate as soon as one
answer fails.

### 1. Frequency

| Frequency | Default |
| --- | --- |
| Constant or keyboard-driven, 100+ times a day | Reject; keep it instant |
| Frequent, tens of times a day | Reject or use nearly imperceptible feedback |
| Occasional modal, drawer, toast, or setting | Standard motion may help |
| Rare first-run, empty, success, or celebration moment | More expression may be earned |

### 2. Purpose

The purpose must be one of:

- **Feedback** — confirm that the interface heard the user.
- **Spatial continuity** — show where something came from or went.
- **State indication** — make a meaningful state change legible.
- **Preventing a jarring change** — bridge content that would teleport.
- **Explanation** — demonstrate how a feature works.
- **Delight** — only for rare or first-time moments.

Reject "it looks cool" and any purpose that cannot be stated concretely.

### 3. Speed

Use the product's existing tokens. As a starting range:

| Element | Typical duration |
| --- | --- |
| Press feedback | 100–160ms |
| Tooltip or small popover | 125–200ms |
| Dropdown or select | 150–250ms |
| Modal, drawer, or sheet | 200–500ms |

Reject ordinary interface motion that only works as a slow performance.

### 4. Function

Ask whether movement helps the user understand or act. Decoration on dense,
functional data usually hinders. Delight belongs in expressive or rare
surfaces, not in information the user is trying to read.

## Sweep

First identify the framework, motion library, existing tokens, product
personality, and rough interaction frequency. Then inspect:

- pressable controls without visible press feedback;
- conditional content that appears or vanishes abruptly;
- accordions and collapsible regions that snap;
- occasional list insertion or removal with no visual bridge;
- anchored surfaces whose origin does not connect to their trigger;
- enter and exit paths that tell conflicting spatial stories;
- gesture-driven elements with hard stops or no settling model;
- rare completion, empty, onboarding, or success moments rendered flat.

Search code as evidence, but do not infer product feel from code alone. When
the rendered experience is available, inspect it. When it is not, state the
uncertainty.

## Motion Recipes

Each surviving opportunity needs exact properties, values, duration, and
easing drawn from the project when possible.

- Prefer `transform` and `opacity` for frequent motion.
- Use a small scale such as `0.95–0.98`, never a normal UI entrance from
  `scale(0)`.
- Anchor popovers and menus to the trigger's transform origin.
- Keep enter and exit directions coherent.
- Prefer retargetable transitions or the project's motion primitive when rapid
  input can interrupt the animation.
- Gate hover-only behavior to hover-capable pointers.
- Include a reduced-motion path that preserves useful state feedback.
- Suggest stagger only when sequence aids comprehension and never while it
  blocks input.

## Output

### Opportunities

Return at most five to seven rows for a whole application and fewer for one
view. Order by leverage.

| # | Location | Today | Purpose | Frequency | Suggested motion |
| --- | --- | --- | --- | --- | --- |
| 1 | `Toast.tsx:41` | Toasts appear instantly | Prevent a jarring change | Occasional | Enter and exit from the same edge using the existing toast easing |

The suggested-motion cell must contain enough exact detail to implement.

### Deliberate rejections

Include two to five candidates you considered but rejected. Name the gate that
stopped each one.

- `CommandMenu.tsx:12` — keyboard-opened palette. **Rejected: constant,
  expert action; animation would add latency.**
- `Chart.tsx:88` — decorative line drawing. **Rejected: movement hinders
  reading functional data.**

If nothing survives, say so. That is a successful result.

### Verdict

Conclude with how much motion the interface actually needs, whether it is
already close, and the single highest-leverage opportunity. Point to
`design-engineering` when the user wants one implemented.

This skill adapts Emil Kowalski's animation-opportunity workflow. See
[references/upstream-license.md](references/upstream-license.md).
