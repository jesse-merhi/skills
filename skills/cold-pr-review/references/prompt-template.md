# Prompt Template

```text
Review PR #<number> on this repository. Run `gh pr view <number>`
and `gh pr diff <number>` to understand what it does. Read any files
you need for context. First map the changed flows, entrypoints,
contracts, side effects, and validation targets. Check for unrelated
diff rubbish, architecture issues, cognitive load, and React state
ownership issues. Check TypeScript type boundaries, API/client contracts,
schemas, casts, `any`, `unknown`, and ts-ignore usage when TypeScript changed.
Apply security and UI lenses when the diff touches those surfaces. Report only
concrete actionable findings tied to changed code or contracts. Report every
distinct actionable finding in this pass, ordered by severity. Before returning,
sweep the target again for independent defects in other files or failure modes
that you may have stopped checking after an earlier finding, then give a merge
verdict.
```

Add domain-specific checklist items only when they are neutral and visible from
the review target, such as "check GitHub Actions expression correctness" or
"walk through the role-permission matrix." Do not include prior findings, fixes
attempted, or desired verdicts.
