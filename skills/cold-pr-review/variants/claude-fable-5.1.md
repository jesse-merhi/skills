---
name: cold-pr-review
description: 'Cold-review a PR, branch, or feature with neutral context, changed-flow coverage, and actionable findings.'
---

# Cold PR review

Run the complete independent review without implementation context. Batch
independent reads and checks. For a long inspection, report only a change in
evidence or direction. Verify unfamiliar or version-sensitive behavior from
current sources. Return actionable, evidence-backed findings; do not edit the
target.

Run an independent review subagent with zero implementation context. The
reviewer sees only the work product, not your reasoning, decisions, or prior
findings. This avoids anchoring bias where knowing why a decision was made
prevents questioning whether it was correct.

## Workflow

1. Dispatch a separate reviewer subagent by default. Use
   [dispatch.md](references/dispatch.md) for harness-specific options and the
   self-review fallback.
2. Give the reviewer only what to review and a neutral checklist.
3. Do not give your reasoning, design decisions, prior findings, fixes attempted,
   implementation approach, or CI status.
4. Use the neutral checklist in [checklist.md](references/checklist.md).
5. Use the prompt template in [prompt-template.md](references/prompt-template.md)
   and add domain-specific checklist items only when they are neutral and visible
   from the review target.
6. Require `finding-discipline`: report only concrete actionable findings tied
   to changed code or contracts, not style nits or vague risks. Keep candidates
   that fail its gates out of the finding list, but return a compact audit-only
   rejection with the failed gate and evidence rationale.

## Required discipline

- Prefer a separate subagent. A cold review loses most of its value if the same
  context that implemented the change also performs the review.
- Give the reviewer the work product, not the story of the work.
- Do not leak prior review outcomes or desired verdicts.
- Keep audit-only rejections separate from findings so they remain measurable
  without becoming suggestions, fixes, or tests.
- If a separate reviewer is unavailable, say so explicitly and perform a fresh
  self-review after deliberately discarding the implementation rationale.

## Context pointers

- Use [dispatch.md](references/dispatch.md) for Codex, Claude Code, other
  harnesses, and self-review fallback.
- Use [checklist.md](references/checklist.md) for neutral review lenses.
- Use [prompt-template.md](references/prompt-template.md) for the cold reviewer
  prompt.
- Use [why-it-works.md](references/why-it-works.md) for anchoring risks and
  common mistakes.
