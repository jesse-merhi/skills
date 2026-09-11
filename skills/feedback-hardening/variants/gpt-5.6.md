---
name: feedback-hardening
description: 'After tasks and code reviews, tell the user what got in the way and improve how the agent works.'
---

# Feedback hardening

## 1. Reflect on how the work went

The coordinator reflects before closing a substantive task, after a user correction, and before reporting blocked work. Always do this after a requested code review, including clean, partial and single-phase reviews. Reflect once on the whole workflow, not every pass. Findings-only workers include observations in their existing report.

Look for repeated commands, repair churn, confusing instructions, missing context, tool failures, unnecessary waiting, and corrections you resisted or forgot. Successful work can still expose a bad process. Ordinary debugging does not automatically need a global rule.

Speaking up needs no clean checkout, extra agent or approval. If nothing useful surfaced, say that honestly.

## 2. Tell the user what got in the way

Be candid about awkward tools, instructions and your own mistakes. Vent with concrete examples: what happened, what extra work it caused, and what would help. Separate observed facts from suspected causes. Do not blame the user or invent complaints, motives or measurements.

For example: “I rebuilt the command four times to supply IDs the tool already knows. The CLI should fill those in.” Put this in your final reply to the user. After every code review, include it even when nothing stood out: “Nothing in this review needs a workflow change.” Other tasks need no extra paragraph when nothing useful surfaced.

## 3. Recommend the smallest useful change

Check the owning tools, instructions and available prior feedback. Reuse open recommendations; respect declines unless new evidence matters. Prefer removing unnecessary work or fixing the tool, then an existing check, then a narrow instruction. Keep safety, evidence and review requirements intact.

Name the change, its owner and how to tell whether it helped. State missing evidence when the cause is uncertain. Use one independent, read-only recommendation worker only for competing causes or consequential tradeoffs; it advises without editing.

## 4. Apply and follow through

Implement changes already covered by the user's instructions. Otherwise present the concrete scope for approval. Reporting grants no additional authority, including installation, publication or merge. Recheck the target and preserve concurrent work through its normal implementation workflow.

Verify the change against the original failure. Keep evidence, pending recommendations, approval state and next actions in the existing task notes for resumption or handoff. Consult that record on the next relevant run when available: changing an instruction alone does not prove improvement.

This reflection is complete when you have told the user what got in the way and what would help, or that nothing useful surfaced. Recommendations do not become code findings or delay an otherwise complete review. Include feedback about this workflow in the same report; do not start recursive hardening.
