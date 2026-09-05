---
name: cold-pr-review
description: 'Cold-review a PR, branch, or feature with neutral context, changed-flow coverage, and actionable findings.'
---

# Cold PR review

Use a separate reviewer to assess the work product with zero implementation
context. This skill's invocation authorizes the required reviewer; dispatch it
without asking again whether to begin.

## Preserve independence at dispatch

Read [dispatch.md](references/dispatch.md). Send only the target and neutral
checklist from [checklist.md](references/checklist.md), using
[prompt-template.md](references/prompt-template.md). Domain additions must be
neutral facts/topics visible in the target. Do not include rationale, design
decisions, implementation approach, prior findings, attempted fixes, CI confidence,
or a desired verdict.

## Judge and report evidence

Require `finding-discipline` for concrete actionable findings tied to changed
code or contracts. Keep style nits, vague risks, and failed-gate candidates out
of the findings list. Return compact audit-only rejections separately with the
failed gate and evidence rationale, without promoting them into suggestions,
fixes, or tests. Review authority does not include source changes.

If the harness cannot supply a separate reviewer, use the documented fallback:
say so explicitly, discard the implementation rationale, and perform a fresh
self-review. Do not claim independence for that result. Consult
[why-it-works.md](references/why-it-works.md) when explaining anchoring risks.
