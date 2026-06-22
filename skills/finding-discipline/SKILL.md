---
name: finding-discipline
description: 'Filter code-review observations into actionable findings for PR, cold, security, and noisy-diff reviews; remove style nits and vague risks.'
---

# Finding Discipline

Use this skill after you have inspected enough code to know a concrete failure mode. The goal is fewer, sharper findings that a PR author can fix.

## Finding Bar

A review finding must satisfy all of these:

- Introduced by the reviewed change or newly exposed by it.
- Tied to a specific changed line, symbol, config, or contract.
- Has a plausible failure mode, not just "this looks risky."
- Explains impact in current product/runtime terms.
- Gives a specific fix direction.
- Has enough confidence that a maintainer would likely want the author to act.

Prefer no finding over a weak finding.

## Exclude

Do not report:

- style, naming, formatting, or architecture taste without a concrete bug
- generic missing tests unless the missing test hides a specific failure mode
- speculative security concerns without an executable path
- broad "consider" suggestions
- duplicate findings that share the same root cause
- stale findings against code that is not part of the reviewed diff
- "could be cleaner" refactors unless the current shape breaks behavior

If something is worth mentioning but not actionable, put it in residual risk or notes, not findings.

## Confirmation Pass

Before finalizing each finding, answer:

1. What exact input, state, timing, permission, platform, or dependency version triggers this?
2. What does the code do now, and why is that wrong?
3. Which current contract proves it is wrong: caller expectation, test, docs, type, API, UI behavior, security boundary, or previous behavior?
4. What is the smallest reasonable fix?
5. Could this be a false positive because of an upstream guard or invariant?

If answers 1-3 are hand-wavy, keep inspecting or drop the finding.

## Output Format

Use this shape for each finding:

```md
[P1/P2/P3] Imperative title under 80 characters

The changed code in `path/to/file.ts` now does <bad behavior> when <trigger>.
That breaks <contract/user-visible behavior> because <evidence>. Fix by
<specific direction>.
```

Include file and line references as tightly as the harness supports. In Codex app reviews, emit `::code-comment{...}` findings when the user asked for review findings.

## Severity

- `P0`: data loss, credential exposure, remote code execution, auth bypass, or service-wide outage.
- `P1`: likely production break, security issue, migration/data corruption, broken core workflow, or broad regression.
- `P2`: real bug with bounded impact, common edge case, or blocked expected workflow.
- `P3`: small correctness issue, rare edge case, confusing but fixable behavior, or low-risk reviewer-blocker.

Do not inflate severity to make a point. A precise `P2` beats a theatrical `P1`.

## Final Review Pass

After drafting findings:

- Merge duplicates under one root cause.
- Remove findings that depend on unproven assumptions.
- Check each line reference still overlaps the reviewed change when possible.
- Make titles action-oriented, not diagnostic labels.
- Keep summaries brief; findings should lead.
