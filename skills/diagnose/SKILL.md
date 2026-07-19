---
name: diagnose
description: 'Debug bugs, failing tests, regressions, flaky behavior, unexpected output, or broken behavior with a reproducible evidence loop.'
---

# Diagnose

Do not start with a fix. Start by making the failure observable and repeatable.

## Workflow

1. State the symptom in one sentence.
2. Find or create the fastest deterministic feedback loop.
3. Reproduce the failure before editing production code.
4. Rank hypotheses by evidence, not plausibility.
5. Instrument surgically only where it answers a specific question.
6. If implementation is authorized, fix the smallest proven cause.
   Otherwise, stop after establishing the cause and recommended fix.
7. When a fix is authorized, add or update regression coverage for real behavior.
8. Verify with the original failing command and the affected broader command set.
9. Report using [reporting.md](references/reporting.md).

## Required Discipline

- If you cannot reproduce the failure, say what you tried and narrow the next
  probe.
- For each hypothesis, name the observation that would confirm or falsify it.
- Remove temporary instrumentation before completion.
- Do not patch around an unknown cause.
- If a proposed fix is speculative, label it as such and keep digging.

## Context Pointers

- Use [feedback-loop.md](references/feedback-loop.md) for reproduction and
  instrumentation options.
- Use [guardrails.md](references/guardrails.md) for what not to claim or change
  without evidence.
- Use [reporting.md](references/reporting.md) for final output shape.
