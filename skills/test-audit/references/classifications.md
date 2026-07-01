# Classifications

Use these labels when auditing tests or assertions:

- `keeper`: catches a verified reachable regression in promised behavior.
- `rewrite`: points at the right risk but asserts the wrong level, stale API
  shape, brittle text, timing, fixture internals, or implementation detail.
- `delete`: covers removed behavior, impossible state, branch-local history, or
  "absence of old thing" with no compatibility promise.
- `changed-but-useless`: a changed or added test passes but would not catch a
  verified reachable future bug.
- `missing`: a verified reachable regression risk introduced by the change has
  no test.
- `no-test-needed`: changed behavior was inspected, and adding coverage would
  only test branch-local history, removed behavior, duplicate coverage, or a
  low-risk addition with no verified reachable future failure to catch.
- `no-change-needed`: related tests exist, but they already cover the changed
  contract and do not need edits.
- `dangerous-removal`: deleted coverage for behavior that still exists.
