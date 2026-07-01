# Classifications

Use these labels for changed files and hunks:

- `required`: implements the feature or preserves existing behavior the feature
  touches.
- `required-test`: validates the feature or a verified reachable regression risk
  introduced by the feature.
- `required-docs`: public behavior/config/API changed, so docs or generated
  docs must change.
- `suspicious`: possibly unrelated; inspect before keeping.
- `rubbish`: unrelated churn, branch-history artifact, stale TODO/comment,
  speculative API, unused helper, low-value test, accidental generated/lockfile
  drift.
- `dangerous-removal`: removed existing behavior, test, mock, cleanup/dispose
  path, validation, auth, route handling, or compatibility without a feature
  reason.
