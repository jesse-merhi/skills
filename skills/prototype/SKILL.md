---
name: prototype
description: 'Build 3–5 UI variants behind a visual picker when explicitly asked to prototype or compare directions.'
---

# Prototype UI variants

Explore one UI decision by building several defensible directions at full
scale. The value is divergence: three tints of the same answer teach the user
nothing.

This skill creates code, so use it only when the user explicitly asks for a
prototype or variants. Keep exploration isolated from production. Promote a
winner only after the user chooses.

## Rules

1. Prototype one UI piece per run. Narrow broad requests to the
   component or interaction with the most at stake.
2. Default to three variants; use at most five.
3. Give every variant a name and a distinct axis such as layout, density,
   personality, motion, or interaction model.
4. Use realistic content and working interactions. No lorem ipsum, dead
   controls, or instructions to imagine missing behavior.
5. Reuse the project's stack, tokens, components, and installed dependencies.
   Do not add a dependency without the user's approval.
6. Keep prototypes on an isolated route or page. Production code must not
   import from the prototype route.
7. Render one variant at a time in realistic surrounding context. Do not judge
   UI from side-by-side thumbnails.
8. Use the fixed picker contract in
   [references/picker.md](references/picker.md). Treat it as picker chrome,
   not as a design direction.
9. When the user chooses a winner, integrate only that direction and remove the
   prototype route unless asked to keep it.

## Workflow

### 1. Scope

Restate the brief in one sentence: what the piece is, where it lives, and what
it must do. If the request names a whole page, choose the component or moment
whose alternatives would teach the user the most and state the boundary.

### 2. Recon

Inspect:

- framework and styling system;
- existing components and installed dependencies;
- color, spacing, type, radius, elevation, duration, and easing tokens;
- product personality and interaction frequency;
- the real surrounding layout and responsive states.

If no project exists, make one standalone HTML file with inline CSS and
JavaScript. Use system fonts, neutral colors, one accent, and no remote
dependencies.

### 3. Name the directions

Before coding, list each direction with its axis.

| Direction | Axis | Question it tests |
| --- | --- | --- |
| Quiet | Low visual and motion intensity | Can the interaction disappear into a daily-use tool? |
| Editorial | Hierarchy and generous measure | Does the moment need more explanatory weight? |
| Direct | Interaction model | Can the user act without opening another screen? |

If two directions differ only in color or copy, combine them and replace one
with a genuine alternative.

### 4. Build the picker page

- In an existing application, use an isolated route such as
  `/prototypes/<slug>`, one module per variant, and one small picker page.
- In a static context, use one self-contained HTML file.
- Load [references/picker.md](references/picker.md) before building. Preserve
  its classes, keyboard behavior, URL persistence, and one-at-a-time stage.
- Put the component in realistic context with plausible data.
- Make the variant swap instant. Switching is a high-frequency comparison
  action and should not animate.

### 5. Verify and pause

Open the picker page, flip through every direction, exercise every control, and
check wide and narrow layouts. Check console output, keyboard access, visible
focus, reduced motion, and the project-specific verification commands.

Then present:

| # | Variant | Axis | When it wins | Its cost |
| --- | --- | --- | --- | --- |

Include the URL or file path and picker keys. Do not choose for the user unless
asked. Stop for the selection.

### 6. Promote

After the user picks:

1. integrate the selected direction using production conventions;
2. run the relevant behavior and visual checks;
3. remove the prototype route and unselected variants unless the user asked to
   keep them.

If the user asks for another round, keep the picker page and diverge around the
direction they preferred.

This skill adapts Emil Kowalski's prototype workflow. See
[references/upstream-license.md](references/upstream-license.md).
