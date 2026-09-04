---
name: diagnose
description: 'Debug bugs, failing tests, regressions, flakiness, or unexpected behavior with reproducible evidence.'
---

# Diagnose

Deliver a supported explanation of the reported failure and, when authorized,
a narrowly scoped repair. Keep the investigation on that failure.

## Evidence to obtain

Start with a repeatable failing command, test, or manual flow before production
edits. Choose the shortest useful loop with
[feedback-loop.md](references/feedback-loop.md). Rank candidate causes and
identify the observation that distinguishes each from its alternatives.
Temporary instrumentation must answer one of those questions.

Use [guardrails.md](references/guardrails.md) throughout. A race, stale build,
cache problem, or environmental cause needs evidence. If the failure cannot be
reproduced, report the attempts and next probe instead of inventing a cause.

## Authorized result

An explanation-only request ends with the cause and recommended fix. A repair
request includes the smallest proven change, regression coverage for the real
behavior, removal of temporary instrumentation, and the original reproduction
plus affected broader checks. Treat speculative fixes as further investigation.

Those checks supply the verification; add work only for a relevant failure,
edit, or unresolved concern. Do not append opportunistic repairs or a generic
second investigation after the evidence is complete.

Return a short evidence trail using [reporting.md](references/reporting.md):
reproduction, cause, any repair, verification, and any unresolved limit.
