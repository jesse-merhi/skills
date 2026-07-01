# Functions And Verification

- Let obvious local helpers infer return types.
- Add explicit return types to exported functions and public API boundaries.
- Before reaching for `npx`, inspect `package.json` and use the repo's scripts
  for typecheck, lint, test, or build.
- In monorepos, check for project-reference scripts before running a package
  typecheck directly. A referenced package may need to build first.

Before writing code against a library or framework, check the installed version
in `package.json`, then use current docs such as Context7 or the project's
official docs for that version.
