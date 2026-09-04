---
name: diagnose
description: 'Debug bugs, failing tests, regressions, flakiness, or unexpected behavior with reproducible evidence.'
---

# Diagnose

Find a reproducible cause for the reported failure. A diagnosis request ends
with evidence and a recommended repair; a fix request includes the smallest
proven repair and regression evidence.

## Investigation

Define the symptom and choose the fastest deterministic reproduction. Use
[feedback-loop.md](references/feedback-loop.md) when selecting a command,
manual flow, or observation. Reproduce before editing production code.

Rank explanations against the evidence. For each remaining hypothesis, identify
an observation that would confirm or reject it, then gather that observation.
Add temporary instrumentation only when it answers that specific question.
Apply [guardrails.md](references/guardrails.md): an unexplained failure is not
permission to guess at a patch or call the environment broken.

## Repair and evidence

When repair is authorized, change one proven cause, add or update coverage of
the real failure, and run the original reproduction plus affected broader
checks. Remove temporary instrumentation. An unconfirmed proposal remains a
hypothesis, not a fix.

Return the cause, supporting reproduction, authorized changes, and verification
using [reporting.md](references/reporting.md). If reproduction is still missing,
report the attempts and the next discriminating probe; do not claim resolution.
