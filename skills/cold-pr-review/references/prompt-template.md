# Prompt template

```text
Review PR #<number> on this repository. Run `gh pr view <number>`
and `gh pr diff <number>` to understand what it does. Review the changed diff
and the runtime flows it directly changes. Read unchanged files only to
understand those flows; do not audit them as independent targets. First map the
changed flows, entrypoints, contracts, side effects, and validation targets.
Check for unrelated diff rubbish, architecture issues, cognitive load, and
React state ownership issues. Check TypeScript type boundaries, API/client contracts,
schemas, casts, `any`, `unknown`, and ts-ignore usage when TypeScript changed.
Apply security and UI lenses when the diff touches those areas. Treat every
observation as a candidate and report it only after three independent checks:
(1) a current supported path reaches the behavior, (2) its likelihood, impact,
affected users, recovery, and current contract make intervention worthwhile,
and (3) the recommended repair addresses the root cause at the owning boundary
and is better than doing nothing after counting complexity and new failure
modes. Omit candidates that fail any check; do not return them as suggestions or
optional hardening. Every finding must identify the changed line or contract
that causes, exposes, or worsens the problem, plus the root cause, recommended
repair, and intervention justification. Exclude pre-existing improvements and
unrelated defects. Report every distinct actionable finding in this pass,
ordered by severity. Before returning, sweep the changed flows again for
distinct failure modes you may have missed, then give a merge verdict.
```

Add domain-specific checklist items only when they are neutral and visible from
the review target, such as "check GitHub Actions expression correctness" or
"walk through the role-permission matrix." Do not include prior findings, fixes
attempted, or desired verdicts.
