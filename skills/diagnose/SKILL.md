---
name: diagnose
description: 'Debug bugs, failing tests, regressions, flaky behavior, unexpected output, or broken behavior with a reproducible evidence loop.'
---

# Diagnose

Do not start with a fix. Start by making the failure observable and
repeatable.

## Workflow

1. State the symptom in one sentence.
2. Find or create the fastest deterministic feedback loop:
   - failing unit/integration/e2e test
   - exact command that reproduces the failure
   - log query or minimal manual flow when tests are unavailable
3. Reproduce the failure before editing production code. If you cannot
   reproduce it, say what you tried and narrow the next probe.
4. Rank hypotheses by evidence, not plausibility. For each hypothesis,
   name the observation that would confirm or falsify it.
5. Instrument surgically:
   - add temporary logs only where they answer a specific question
   - prefer assertions, traces, focused tests, and small command output
   - remove temporary instrumentation before completion
6. Fix the smallest proven cause.
7. Add or update regression coverage when the failure was real behavior.
8. Verify with the original failing command and the affected broader
   command set.

## Guardrails

- Do not patch around an unknown cause.
- Do not claim a race, cache issue, stale build, or environment issue
  without evidence.
- Do not change multiple independent things before rerunning the
  feedback loop.
- If a proposed fix is speculative, label it as such and keep digging.

## Reporting

Lead with:

- `Reproduction`: exact command or flow and result
- `Cause`: the smallest proven cause
- `Fix`: what changed
- `Verification`: commands run and outcomes
