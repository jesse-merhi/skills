---
name: diagnose
description: 'Debug bugs, failing tests, regressions, flakiness, or unexpected behavior with reproducible evidence.'
---

# Diagnose

Make the reported failure repeatable, establish its cause, and complete the
repair only when the request authorizes one.

1. Describe the observed symptom in one sentence. Select a deterministic test,
   command, or manual flow with [feedback-loop.md](references/feedback-loop.md).
   Record the failing result before changing production code.
2. List the plausible causes in evidence order. Give each a confirming or
   falsifying observation. Batch independent reads; run dependent experiments
   in order so a result can change the next experiment.
3. Investigate the leading causes. Use current sources for unfamiliar or
   version-sensitive behavior. Add logs or traces only to answer a named
   question. Follow [guardrails.md](references/guardrails.md); speculation
   stays labelled until an observation establishes the cause.
4. For diagnosis-only work, report the cause and recommended repair without
   implementing it. For an authorized fix, change the smallest proven cause
   and add or update regression coverage for the actual failure. Keep unrelated
   improvements and whole-file rewrites outside that change.
5. Remove temporary instrumentation. Run the original failing command and the
   affected broader checks, stopping to investigate a failure before retrying.
6. Report through [reporting.md](references/reporting.md), stating what failed,
   why, what changed if anything, and which checks support the result.

If reproduction fails, state the attempts and choose a narrower probe. During
long work, report a changed hypothesis, useful evidence, or a blocker rather
than narrating every command. Finish at the endpoint the user authorized.
