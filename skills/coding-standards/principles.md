# Coding standards principles

This sheet mirrors the standards in `catalog.json`. Update both files together.

## Code and CLIs explain their usage and behavior

`self-documenting-code` · `any`

Make code and CLIs explain their usage and behavior themselves. Use clear names and control flow, discoverable command help with useful examples and defaults, and actionable errors. Put non-obvious implementation rationale beside the relevant code. Do not add companion Markdown merely to explain implementation details or command usage; improve the code or CLI instead. Keep explicitly requested documents, required artifacts, and separate architecture or design explanations in their proper place. This rule does not authorize deleting existing documentation.

## No decorative comment separators

`no-banner-comments` · `any`

A comment should say something. Rows of dashes or equals signs only add noise and go stale when the code around them moves. Write a plain one-line section comment, or nothing.

## No pass-through wrappers

`no-trivial-forwarding-wrapper` · `any`

A helper whose whole body is `return other(sameArgs)` adds a name and a hop without adding meaning. Call the underlying function directly. Keep a wrapper only when it captures a concept, enforces an invariant, or marks a real boundary. Do not add a wrapper solely for test convenience.

## No broad snapshots in ordinary tests

`no-large-test-snapshots` · `tests`

A whole-output snapshot fails on every unrelated change and gets re-recorded without being read, so it stops proving anything. Assert the specific fields or behaviour the test is about, and keep deliberate serializer coverage in files named for it.

## No blanket disables of protected rules

`no-broad-rule-disable` · `any`

A file- or block-level disable silently turns a rule off for everything below it, including code written later. Disable a protected rule on the single line that needs the exception, so the next reader sees exactly what was excused and why. A bare eslint-disable with no rule name is invisible to ESLint itself, so pair this rule with a repository-wide grep for it.

## No raw SQL escape hatches

`no-raw-sql` · `prisma`

Query-builder escape hatches such as `Prisma.raw` hand a string straight to the database, so any interpolated value becomes injectable. Use parameterised queries or the builder's typed API instead.

## No raw color literals in color props

`no-raw-color-literals` · `react-native`

A hex or rgb() literal in a color prop bypasses the theme, so it cannot follow light and dark mode or a palette change. Use a theme token.

## No weak schema types

`no-zod-type-any` · `zod`

Weak schema types such as `ZodTypeAny` or a bare `ZodType` accept anything, so the validated value arrives untyped and the boundary stops proving anything. Name the precise schema type the boundary actually parses.

## Parse unknown boundary values with a schema

`prefer-zod-for-unknown-typeof` · `zod`

Hand-written `typeof` and `instanceof` checks on an unknown value validate one field at a time and drift from the shape the code expects. Parse the value once with a schema, and work with the typed result.

## No light-mode-only color utilities

`no-light-mode-only-colors` · `tailwind`

A hard-coded light neutral such as `bg-gray-100` looks correct until dark mode is on, and then it is unreadable. Use the semantic token, or pair the utility with an explicit dark counterpart.

## Elevation comes from named tokens

`no-raw-elevation` · `tailwind`

Ad-hoc shadow utilities scatter a depth scale across the codebase and drift apart. Remove the decorative shadow, or use a named elevation token so layering stays one decision.

## No undersized or all-caps text

`no-small-text` · `tailwind`

Text below the minimum size is hard to read, arbitrary pixel sizes bypass the type scale, and all-caps copy is slower to read and mangled by screen readers. Use a shared typography token and sentence case, and mark a genuine exception in a comment.

## No oversized or out-of-scale breakpoints

`no-wide-arbitrary-breakpoints` · `tailwind`

A one-off breakpoint above the layout's widest named step, or a named step beyond it, splits responsive behaviour across two systems that no longer agree. Use a named responsive variant within the shared scale, and document a component-specific exception in a comment.

## Use component variants for appearance

`no-component-restyling` · `tailwind`

Keep reusable components responsible for their appearance. At call sites, use their variants and sizes, and limit className to layout or the component's documented contract. Components can style their own internals.

## Use semantic Tailwind theme colors

`no-raw-tailwind-colors` · `tailwind`

Raw palette utilities and literal colors bypass the design system. Use semantic tokens from the application's theme so colors follow theme changes; record narrow exceptions for intentional fixed colors.

## Use the Tailwind theme scale

`no-arbitrary-tailwind-values` · `tailwind`

One-off arbitrary values scatter design decisions through components. Use the shared theme scale or CSS variable utilities, and document values that a real component or library contract requires.

## Use classes for web styling

`no-inline-web-styles` · `tailwind`

Keep web appearance in classes and pass runtime values through CSS custom properties. Use narrow, documented exceptions when a library owns an inline property; preserve its positioning, animation and interaction behavior.

## Use classes that the application can render

`no-unknown-tailwind-classes` · `tailwind`

Check classes against the installed Tailwind compiler and the application's actual theme. Fix misspelled utilities and variants; allow external classes only when their stylesheet is loaded. Resolve theme-loading failures before claiming compiler-backed coverage.

## Keep component class choices statically readable

`static-component-classes` · `tailwind`

Use complete class strings and explicit variant maps so Tailwind and design-system checks can read every choice. Avoid constructing fragments such as a color inside a utility name; use CSS custom properties for genuinely dynamic values.

## Stable selectors in end-to-end tests

`no-brittle-e2e-selectors` · `e2e`

Selectors built from DOM position, class attributes, or styling classes break when markup is restructured even though the product still works. Select by role, label, visible text, or test id.

## No exact style assertions in ordinary tests

`no-brittle-test-style-assertions` · `tests`

Asserting exact class strings or computed styles pins a test to today's styling rather than to what the user can do, so it fails on restyles and passes through real breakage. Assert user-visible behaviour, and keep deliberate visual coverage in files named for it.

## Imports and exports keep one order

`import-sorting` · `any`

One mechanical import order removes a whole class of merge conflicts and makes a missing dependency obvious at a glance. Let the linter decide the order rather than each author.

## Imports resolve to one real module

`import-hygiene` · `any`

Duplicate, self-referential, and module-system-mixing imports produce modules that load twice or not at all, and the failure shows up far from the import. Keep one import per module and let it resolve.

## Async results are settled exactly once

`promise-correctness` · `any`

A promise resolved twice, returned from a `finally`, or wrapped in a needless extra promise loses errors and results silently. Settle each async result once, on a path the reader can follow.

## Control flow says what it does

`control-flow-correctness` · `any`

Branches that are all identical, a `catch` that only rethrows, a loop counter changed inside the body, and a `map` callback with no return all read as intent but behave as an accident. Make the branch, the handler, and the loop do the thing they appear to do.

## The TypeScript recommended baseline stays on

`typescript-recommended` · `typescript`

typescript-eslint's recommended set catches the TypeScript mistakes the compiler still accepts: unsafe `any`-adjacent types, empty object types, misused `new`, and stale triple-slash references. The typescript preset spreads it wholesale, so the catalog lists it rather than letting two dozen enforced rules go undocumented.

## No escape hatches out of the type system

`strict-types` · `typescript`

`any` and type assertions tell the checker to stop looking, so the first wrong assumption surfaces at runtime instead of at the keyboard. Describe the real type, or validate the value at the boundary.

## Components render as pure functions

`react-hooks-purity` · `react`

Rendering that mutates shared values, reads refs, or sets state mid-render makes output depend on how many times React ran it. Keep render a pure function of props and state, and put effects where effects belong.

## Effects only reach outside the component

`react-effect-discipline` · `react`

An effect used to derive state, chain updates, or hand data back to a parent adds a render pass and a way for the two copies to disagree. Compute derived values during render, and keep effects for genuinely external systems.

## Component files export components

`react-fast-refresh-exports` · `react`

When a file mixes components with other exports, hot reload cannot swap it and remounts the tree, losing local state on every edit. Keep components in their own files.

## Web UI is reachable without a mouse

`web-accessibility` · `react`

Images without alt text, controls without labels, click handlers without key handlers, and invalid ARIA lock people out of the interface entirely. Name every control, and make everything clickable reachable by keyboard.

## Native UI exposes its controls

`native-accessibility` · `react-native`

A touchable with no accessibility role, label, or state is invisible to VoiceOver and TalkBack, and nested touchables swallow each other's taps. Describe each control the way assistive technology needs to read it.

## Cached queries declare what they depend on

`query-hygiene` · `tanstack-query`

A query whose key omits an input serves another input's cached data, and an unstable dependency refetches forever. State every input in the key, and keep the option order the library expects.

## Tests actually run and actually assert

`test-hygiene` · `tests`

A focused, skipped, commented-out, or conditionally defined test passes without checking anything, and an unawaited assertion reports success before the result arrives. Every test in the suite should run and its assertions should be waited for.

## End-to-end tests wait for the app, not the clock

`e2e-hygiene` · `e2e`

Fixed sleeps, network-idle waits, and forced clicks make a suite that is slow when it passes and useless when it fails. Wait for the state the assertion needs, and let the framework's web-first assertions do the retrying.
