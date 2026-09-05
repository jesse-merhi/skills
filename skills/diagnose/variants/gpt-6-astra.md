---
name: diagnose
description: 'Debug bugs, failing tests, regressions, flakiness, or unexpected behavior with reproducible evidence.'
---

# Diagnose

Use the request and existing evidence to decide the endpoint: explain the cause,
or repair it and prove the repair. An already-authorized fix does not need a
second permission question. A request to investigate does not authorize
implementing a repair; temporary targeted instrumentation remains available.

## Establish the failure

Choose a short deterministic feedback loop from the actual symptom. See
[feedback-loop.md](references/feedback-loop.md) for tests, commands, manual
flows, and instrumentation. Capture a reproduction before production edits.
If it cannot be reproduced, report the attempted conditions and select the
next probe that distinguishes the remaining explanations.

## Establish the cause

Order hypotheses by evidence and test a confirming or falsifying observation
for each. Instrument a specific uncertainty rather than collecting broad logs.
Use [guardrails.md](references/guardrails.md) to keep environmental explanations
and proposed fixes tied to observations. Continue the investigation while the
cause remains speculative.

## Reach the requested endpoint

For diagnosis, return the established cause and recommendation. For repair,
apply the smallest causal change and add or update a regression check. Remove
temporary instrumentation, rerun the reproduction, and complete the affected
broader checks. Expand verification only when the change, a failure, or an
unresolved concern justifies it.

Use [reporting.md](references/reporting.md) for the final evidence. Say plainly
what is proved and what remains unknown; do not turn an incomplete diagnosis
into a success claim or an offer to do work already requested.
