# Coding standards catalog

`catalog.json` lists the standards, preset files, and exact dependency versions.
Use the skill's **Read expectations** mode during implementation and review.
Standards without bundled enforcement still apply as guidance. Applying or
syncing checks requires an explicit request. For an authorized adoption,
select the presets your project needs and install their packages alongside the
ecosystem packages. Copy the entire `eslint/` directory together so preset,
plugin, rule, and helper imports remain intact.

For query return-value checks, compose `typescript({ typeChecked: true })` with
`tanstackQuery({ typeChecked: true })`; the files must belong to a tsconfig.
Typed Jest checks default to TypeScript tests. If your typed parser also covers
JavaScript, pass matching `typeCheckedFiles` globs to `jest({ typeChecked: true })`.

Playwright defaults cover `tests/`, `e2e/`, `playwright/`, and `*.e2e.{spec,test}.*`.
For mixed-runner projects, pass `files` scoped to your Playwright suite.

## Tailwind v4 design-system checks

The `tailwind-v4` preset adds the six checks from [`@shadcn/lint`](https://github.com/shadcn-ui/lint), pinned to `0.1.0`. It requires Tailwind v4, Node.js 20.19 or later, and ESLint 9.30 or later. Select it only for compatible web packages; the catalog's package-name hint cannot distinguish Tailwind versions. Keep the existing `tailwind` preset for its separate typography, elevation, breakpoint and light/dark color checks. This addition does not cover Tailwind v3 or React Native styling.

The dependency is MIT-licensed development tooling with no application bundle import. Version 0.1.0 is an early release; verify diagnostics against the target's actual components and theme. It brings its own parser and class-analysis dependencies. For a target that already uses Oxlint, the same plugin supports Oxlint 1.80 or later through its alpha JS plugin API. Configure it there directly instead of adding a second lint runner; this bundled preset is ESLint-only.

Compose the preset with the target's existing parser configuration. Scope each app separately so its `components.json`, TypeScript aliases and Tailwind theme can be discovered:

```js
import tailwindV4 from "./eslint/presets/tailwind-v4.mjs";

export default [
  // Keep the project's existing parser and other checks here.
  ...tailwindV4({
    files: ["src/**/*.{ts,tsx}"],
    componentFiles: ["src/components/ui/**"],
  }),
];
```

The preset enables `no-restyle`, `no-raw-colors`, `no-arbitrary-values`, `no-inline-styles`, `no-unknown-classes` and `require-static-classes` as errors. Component call sites allow layout changes by default. Only `no-restyle` is disabled in `componentFiles`, which defaults to `**/components/ui/**`; the other checks still apply to component implementations within `files`.

Use `settings` for native `settings.shadcn` values such as `ui`, `componentImports`, and `note`. When components live elsewhere, set both their recognition settings and `componentFiles`. Use `rules` for native rule configurations, including component contracts and narrow exceptions. A contract's `allow` list replaces the inherited list, so include `layout` when the component should retain it. Consult the upstream [rule options](https://github.com/shadcn-ui/lint/blob/main/docs/rules.md) for matching semantics.

Run the chosen checks over the real target, inspect each finding, and fix valid violations within the authorized repair scope. Preserve library-owned positioning and animation; allow external class names only when their stylesheet actually loads. Record justified exceptions and any uncovered requirements. Fix theme-loading warnings before treating `no-unknown-classes` as compiler-backed verification: its fallback grammar provides weaker coverage. Compare overlapping existing checks before removing anything; these six rules do not replace the existing minimum text size, elevation, breakpoint or explicit dark-mode protections. A passing run in this skills repository validates the integration, not an application's theme or appearance.

## React Native with npm

The React Native preset retains seven accessibility checks plus the shared
color-token and minimum-text-size checks. Its pinned accessibility plugin,
`eslint-plugin-react-native-a11y@3.5.1`, declares ESLint peers only through v8,
so npm rejects the catalog's ESLint 9.39.2 dependency set without an override.

Before installing with npm, merge this fragment into the consuming project's
root `package.json`, preserving its other dependencies and overrides:

```json
{
  "devDependencies": {
    "eslint": "9.39.2",
    "eslint-plugin-react-native-a11y": "3.5.1"
  },
  "overrides": {
    "eslint-plugin-react-native-a11y@3.5.1": {
      "eslint": "9.39.2"
    }
  }
}
```

Then run `npm install`. npm reads overrides only from the project root, not
from copied presets or installed packages. This exception changes neither
plugin code nor enabled rules; do not use `--force` or `--legacy-peer-deps`.

This is a temporary exception for those exact versions: all nine configured
checks were exercised on ESLint 9.39.2, and npm resolution passed a dry-run.
Revalidate before changing either pin. Remove the override when adopting an
upstream release whose peer range supports the chosen ESLint version.

## React Native grid roles

The pinned accessibility plugin rejects `accessibilityRole="grid"`, even though
React Native supports it. On React Native versions that support the `role` prop,
use the framework's grid role on a scroll or list component:

```jsx
<ScrollView role="grid" />
```

React Native documents `role="grid"` for `ScrollView`, `VirtualizedList`,
`FlatList`, and `SectionList` in its [accessibility reference](https://reactnative.dev/docs/accessibility#role).
This needs no custom validator, dependency patch, or disabled rule; all nine
preset checks remain enabled. The plugin does not validate the newer `role`
prop, so a lint pass alone does not prove its value is valid or the UI accessible.

Existing `accessibilityRole="grid"` usage still triggers the upstream false
positive. The bundle leaves that validator unchanged; revisit this limitation
when updating the dependency.
