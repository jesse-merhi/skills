---
name: diagnose
description: 'Debug bugs, failing tests, regressions, flakiness, or unexpected behavior with reproducible evidence.'
---

# Diagnose

Diagnose the reported failure through an evidence-backed conclusion. Begin by
making the failure observable and repeatable. Stay within diagnosis scope:
change production code and regression coverage only when implementation is
authorized.

Before the first tool call, give one short sentence naming the symptom and next
probe. Update the user only when reproduction changes the hypotheses, the cause
becomes clear, or the investigation changes direction. Lead the final response
with the cause and fix status, follow the reporting contract, and keep any saved
diagnosis to the evidence needed for someone else to reproduce the conclusion.

Use the workflow's reproduction and verification commands as often as the
observed failure or flakiness requires to establish evidence. Do not rerun them
only for a generic double-check. Keep the investigation in the current session
unless the user and harness authorize one sizeable, independent investigation;
never delegate merely to recheck your own conclusion.

## Workflow

1. State the symptom in one sentence.
2. Find or create the fastest deterministic feedback loop.
3. Reproduce the failure before editing production code.
4. Rank hypotheses by evidence, not plausibility.
5. Instrument surgically only where it answers a specific question.
6. If implementation is authorized, fix the smallest proven cause.
   Otherwise, stop after establishing the cause and recommended fix.
7. When a fix is authorized, add or update regression coverage for real behavior.
8. Verify with the original failing command and the affected broader command
   set. Repeat when needed to establish flaky behavior; do not add a redundant
   generic verification pass.
9. Report using [reporting.md](references/reporting.md).

## Required discipline

- If you cannot reproduce the failure, say what you tried and narrow the next
  probe.
- For each hypothesis, name the observation that would confirm or falsify it.
- Remove temporary instrumentation before completion.
- Do not patch around an unknown cause.
- If a proposed fix is speculative, label it as such and keep digging.

## Context pointers

- Use [feedback-loop.md](references/feedback-loop.md) for reproduction and
  instrumentation options.
- Use [guardrails.md](references/guardrails.md) for what not to claim or change
  without evidence.
- Use [reporting.md](references/reporting.md) for final output shape.
