---
name: cold-pr-review
description: 'Cold-review a PR, branch, or feature with neutral context, changed-flow coverage, and actionable findings.'
---

# Cold PR review

Obtain an independent evidence-backed review of the work product without
implementation context. Prefer a separate reviewer subagent; use
[dispatch.md](references/dispatch.md) for the harness route and fallback.

Give the reviewer only the target and a neutral checklist. Read
[checklist.md](references/checklist.md) and use
[prompt-template.md](references/prompt-template.md). Additional domain topics
must be neutral and visible from the target. Exclude implementation rationale,
design decisions, earlier findings, attempted fixes, implementation approach,
CI status, and desired verdicts.

Require `finding-discipline`. Findings must be concrete actionable defects tied
to changed code or contracts, not style nits or vague risks. Return failed-gate
candidates separately as compact audit-only rejections naming the gate and
evidence rationale; do not turn them into suggestions, fixes, or tests.

If no independent reviewer is available, disclose that limitation and perform
a fresh self-review after deliberately discarding implementation rationale.
Do not describe that fallback as independent. Use
[why-it-works.md](references/why-it-works.md) when anchoring risks or common
mistakes need explanation. Return the review evidence without editing the target.
