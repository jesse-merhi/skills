# Rubbish Signals

Look hard at:

- Removed tests or mocks with no replacement.
- New tests that only prove intentionally removed behavior, fields, callbacks,
  routes, screens, or modes stay gone, with no current compatibility, privacy,
  migration, or security contract.
- New tests for additions where the test cannot catch a verified reachable
  product, API, data, security, or workflow regression.
- New regression tests that do not show a real failing path through current code,
  contracts, data, permissions, or user flows. Security vulnerabilities, auth
  bypasses, data loss, and migration corruption are valid targets when the path
  is real.
- Frontend tests that only assert incidental UI copy, headings, placeholders,
  button text, or marketing text without proving behavior, state, permissions,
  submitted data, rendered data, routing, or a stable accessibility contract.
- Removed cleanup/dispose/abort/timeout/no-route handling.
- Helper renames that silently drop fields.
- New "deprecated", "backwards compatible", "regression", or TODO comments
  referring only to branch-local history, not `main`.
- Comment duplication between types, tests, and implementation.
- Inline import rewrites or mock timing changes unrelated to the feature.
- Log-level changes, copy changes, or style churn not required by behavior.
- Public type fields that are not populated by runtime code.
- UI changes that broaden behavior beyond the feature.
- Generated docs/schema/hash changes without source changes.
- `package.json`, lockfile, tarball, patch, vendored, or dependency drift.
- New generic helpers whose only current use is narrow.
- Trivial pass-through helpers that only rename a single function call or
  one-line expression without encoding a policy boundary, type boundary, or
  repeated domain concept.
- Lazy-loading or inline `import(...)` type references added only to avoid a
  normal static import, unless they protect a real runtime boundary or cycle.
