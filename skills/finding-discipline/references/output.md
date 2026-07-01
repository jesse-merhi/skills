# Output

Use this shape for each finding:

```md
[P1/P2/P3] Imperative title under 80 characters

The changed code in `path/to/file.ts` now does <bad behavior> when <trigger>.
That breaks <contract/user-visible behavior> because <evidence>. Fix by
<specific direction>.
```

Include file and line references as tightly as the harness supports. In Codex
app reviews, emit `::code-comment{...}` findings when the user asked for review
findings.

## Severity

- `P0`: data loss, credential exposure, remote code execution, auth bypass, or
  service-wide outage.
- `P1`: likely production break, security issue, migration/data corruption,
  broken core workflow, or broad regression.
- `P2`: real bug with bounded impact, common edge case, or blocked expected
  workflow.
- `P3`: small correctness issue, rare edge case, confusing but fixable behavior,
  or low-risk reviewer-blocker.

Do not inflate severity to make a point. A precise `P2` beats a theatrical
`P1`.
