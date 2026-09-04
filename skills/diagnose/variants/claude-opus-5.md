---
name: diagnose
description: 'Debug bugs, failing tests, regressions, flakiness, or unexpected behavior with reproducible evidence.'
---

# Diagnose

Outcome: establish a reproducible cause, then make the smallest authorized fix
and prove it against the original failure.

## Workflow

Keep one evidence trail from reproduction to cause to the authorized endpoint. Do not turn a narrow investigation into opportunistic repairs or repeat passing checks without a relevant edit, failure, or unresolved concern.

1. State the symptom in one sentence and establish the fastest deterministic
   feedback loop.
2. Reproduce the failure before editing production code.
3. Rank hypotheses by evidence and name the observation that would confirm or
   falsify each one.
4. Instrument only where it answers a specific question.
5. If implementation is authorized, fix the smallest proven cause and add or
   update regression coverage for real behavior. Otherwise, stop with the
   established cause and recommended fix.
6. Verify with the original failing command and the affected broader command
   set, then report using [reporting.md](references/reporting.md).

## Required discipline

- If you cannot reproduce the failure, say what you tried and narrow the next
  probe.
- Remove temporary instrumentation before completion.
- Do not patch around an unknown cause.
- If a proposed fix is speculative, label it as such and keep digging.

## Context pointers

- Use [feedback-loop.md](references/feedback-loop.md) for reproduction and
  instrumentation options.
- Use [guardrails.md](references/guardrails.md) for what not to claim or change
  without evidence.
- Use [reporting.md](references/reporting.md) for final output shape.
