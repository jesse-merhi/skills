# Check what belongs in the diff

Check that changes support the requested behavior. Inspect suspicious additions and removals against the actual base and prior code.

Look for unrelated refactors, unused helpers, duplicate explanations, unnecessary generic APIs and generated/schema/lockfile drift without matching source changes. Check removed cleanup, abort, timeout, validation, authorization and route handling. Preserve required fields when types or helpers change.

Use `writing-good-tests` to assess test value and coverage. Question tests of mock wiring, incidental copy, impossible inputs or intentionally removed behavior. Preserve the last useful test of a promised behavior unless an inspected equivalent replaces it. An unfamiliar guard or old test needs investigation, not automatic deletion.

Return specific keep, revert, restore or remove recommendations with their purpose and evidence. Distinguish unrelated churn from dangerous removal; fewer lines is not the goal. Keep worthwhile adjacent work separate unless authorized. Use a per-file table only when it helps.
