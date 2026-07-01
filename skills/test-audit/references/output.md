# Output

For a review, report:

- `Keep`: tests that protect real behavior.
- `Rewrite`: tests that target a real risk but assert it poorly.
- `Delete`: tests/assertions that do not earn their keep.
- `Changed but useless`: changed tests that pass but should not exist.
- `Missing`: specific verified reachable behavior risks that need coverage.
- `No test needed`: changed behavior inspected where new coverage would not
  catch a verified reachable future bug.
- `No change needed`: related tests inspected and why they still fit.
- `Dangerous removals`: deleted tests that still protect promised behavior.
- `Validation`: commands run and result.

For each `Rewrite`, `Delete`, `Missing`, or `Dangerous removal`, include the
smallest useful reason:

```md
`path/to/test.ts`: delete the `systemAlerts` absence assertion. The API no
longer exposes that field, and no compatibility/privacy contract requires
testing its absence. Assert the new alert list shape instead.
```

## Stale API Assertion Example

If a PR replaces:

```ts
expect(json.data.alerts.systemAlerts.length).toBe(2);
```

with:

```ts
expect(json.data.alerts).not.toHaveProperty("systemAlerts");
```

flag the new assertion for deletion unless the API explicitly promises that
`systemAlerts` must never appear for compatibility or privacy reasons. A better
test would assert the new alert contract that callers now consume.
