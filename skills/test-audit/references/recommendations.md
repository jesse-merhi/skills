# Recommendations

Recommend focused changes:

- Remove or rewrite tests that only prove old fields are gone, old callbacks are
  absent, mocks were called in a specific order, or impossible data is ignored.
- Do not keep a test just because it guards against "the old design coming back"
  when the old design is no longer reachable through current product contracts.
- Add tests only for verified reachable risks introduced by the PR.
- Do not add tests for intentionally removed features, fields, callbacks,
  routes, screens, or modes unless the current product contract promises that
  absence for compatibility, privacy, migration, or security reasons.
- Do not add tests for a new feature or addition when the test would only prove
  wiring, rendering, status codes, or mock calls without catching a verified
  reachable product, API, data, security, or workflow regression.
- Do not add frontend tests that only assert arbitrary UI copy, button text,
  headings, placeholder text, or marketing text. Use text selectors when they
  are the best stable way to find an element, but assert the behavior or state
  that matters after finding it.
- Prefer one test that exercises the user/API contract over several tests that
  assert internals.
