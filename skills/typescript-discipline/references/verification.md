# Functions and verification

- Let obvious local helpers infer return types.
- Add explicit return types to exported functions and public API boundaries.
- Before reaching for `npx`, inspect `package.json` and use the repo's scripts
  for typecheck, lint, test, or build.
- In monorepos, check for project-reference scripts before running a package
  typecheck directly. A referenced package may need to build first.

Before writing code against a library or framework, check the installed version
in `package.json`, then use the project's official docs or the remote Context7
workflow in [context7.md](context7.md) for that version. A configuration entry
alone does not prove Context7 is callable; verify it with an actual tool call.
If it is unavailable, use the official docs or installed package source. Do not
install or start a local Context7 helper as a fallback.
