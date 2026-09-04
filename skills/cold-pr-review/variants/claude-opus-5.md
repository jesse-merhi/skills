---
name: cold-pr-review
description: 'Cold-review a PR, branch, or feature with neutral context, changed-flow coverage, and actionable findings.'
---

# Cold PR review

Return an independent review with actionable findings and a separate compact
rejection audit. Use one fresh reviewer of the work product; do not add recursive
verifier workers or an optional final sweep.

Follow [dispatch.md](references/dispatch.md) to select the separate subagent
route. Build its brief from the target, [checklist.md](references/checklist.md),
and the scope/evidence requirements of
[prompt-template.md](references/prompt-template.md). Omit the template's additional
sweep: completion is full changed-flow coverage and the verdict. Request discovery
of every genuine scoped candidate before applying actionability filters.

Keep context neutral. Domain checklist additions must be visible from the target.
Exclude implementation rationale, design decisions, approach, prior findings,
attempted fixes, CI status, and desired verdicts. Do not edit the target.

Apply `finding-discipline` after discovery. Report concrete actionable defects
tied to changed code/contracts. Put failed-gate candidates in a compact separate
audit with the gate and evidence rationale. Nits and vague risks do not become
findings, and audit-only rejections do not become suggestions, fixes, or tests.

If a separate reviewer is unavailable, disclose the limitation and use the
fresh self-review fallback after deliberately discarding implementation rationale.
Do not claim that fallback is independent. See
[why-it-works.md](references/why-it-works.md) for anchoring risks and common mistakes.
