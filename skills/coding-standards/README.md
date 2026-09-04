# Coding standards catalog

`catalog.json` lists the standards, preset files, and exact dependency versions.
Select the presets your project needs and install their packages alongside the
ecosystem packages. Copy the entire `eslint/` directory together so preset,
plugin, rule, and helper imports remain intact.

For query return-value checks, compose `typescript({ typeChecked: true })` with
`tanstackQuery({ typeChecked: true })`; the files must belong to a tsconfig.

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
