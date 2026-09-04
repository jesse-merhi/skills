---
name: cold-pr-review
description: 'Cold-review a PR, branch, or feature with neutral context, changed-flow coverage, and actionable findings.'
---

# Cold PR review

Review the work product independently. The reviewer must not receive the story
of how it was implemented or the result you hope to get.

1. Read [dispatch.md](references/dispatch.md) and dispatch a separate reviewer
   subagent using the supported harness route.
2. Give only the review target and neutral checklist from
   [checklist.md](references/checklist.md), using
   [prompt-template.md](references/prompt-template.md). Add domain-specific topics
   only when they are neutral and visible from the target.
3. Exclude your rationale, decisions, implementation approach, prior findings,
   attempted fixes, CI status, and desired verdict. Do not carry implementation
   history into the reviewer session.
4. Have the reviewer inspect the complete scope, batch independent reads/checks,
   and verify unfamiliar or version-sensitive behavior from current sources.
   For long reviews, report changed evidence or direction without exposing prior
   implementation context.
5. Require `finding-discipline`. Return concrete actionable defects tied to
   changed code/contracts. Put rejected candidates in a separate compact audit
   record with failed gate and evidence rationale. Do not present nits, vague
   risks, or audit-only rejections as suggestions, fixes, or tests.

If an independent reviewer is unavailable, explicitly disclose the fallback
and perform a fresh self-review after discarding implementation rationale.
The result is not independent. Read [why-it-works.md](references/why-it-works.md)
for anchoring risks and common mistakes when needed. Keep this review read-only.
