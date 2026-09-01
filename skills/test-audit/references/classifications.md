# Classifications

Use these labels when auditing tests or assertions:

- `keeper`: is the executable owner of a distinct reachable regression in
  promised behavior.
- `consolidate`: owns a distinct reachable regression but repeats the setup or
  assertion shape of other distinct owners; retain the cases while sharing one
  table or setup.
- `move`: owns a real risk, but the same intended outcome should be proved at a
  different boundary; relocate the test without changing that outcome.
- `rewrite`: points at the right risk and boundary but uses a stale API shape,
  brittle text, timing, fixture internals, implementation detail, or a
  tautological expected value.
- `delete`: covers removed behavior, impossible state, branch-local history,
  equivalent duplicate coverage with another retained owner and no distinct
  regression, orphaned test infrastructure, or "absence of old thing" with no
  compatibility promise.
- `changed-but-useless`: a changed or added test passes but would not catch a
  verified reachable future bug.
- `missing`: a verified reachable change-relevant regression risk has no test.
- `no-test-needed`: changed behavior was inspected, and adding coverage would
  only test branch-local history, removed behavior, duplicate coverage, or a
  low-risk addition with no verified reachable future failure to catch.
- `no-change-needed`: related tests exist, but they already cover the changed
  contract and do not need edits.
- `dangerous-removal`: deletes the last executable owner of a promised
  regression without an equivalent, inspected replacement at the required
  cadence.
