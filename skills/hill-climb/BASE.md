---
name: hill-climb
description: 'Iterate on a change against a fixed, measurable eval until it reaches a target score, then optionally cut cost while holding the score.'
metadata:
  sources: |
    - Informed by Theo’s [Agents Sucked At UI (Until Today)](https://www.youtube.com/watch?v=xq0eB8vxeqk), reviewed 2026-11-13.
---

# Hill climb

For model-judged UI design quality, use [code-review](../code-review/SKILL.md)'s UI polish mode instead.

## 1. Fix the eval

Use the user's metric, target and budget, or state the ones you infer. Prefer a runnable check: a test suite, benchmark, size or token count, or an eval of recorded cases. Build cases from real failures where they exist, such as logs, bug reports or past agent sessions found with [session-recall](../session-recall/SKILL.md). Hold back some cases to catch overfitting. Record the command, inputs, environment and a baseline score with its revision.

For a model-judged eval, run each case enough times to see its spread and judge by agreement across runs, not a single result.

## 2. Climb

Make one coherent change at a time, rerun the eval and record the revision and score. Keep a change only when the score improves. Commit locally each time a target is met so a working checkpoint survives later attempts.

Do not edit the eval, its cases, fixtures or thresholds during the climb without the user's agreement. Inspect each gain for special-casing of eval inputs and confirm it on the held-back cases.

## 3. Cut cost under the score

When the user wants a cheaper result, such as shorter prompts or tool descriptions, fewer tokens, less data sent or faster runs, start from the committed checkpoint and cut while every run still meets the target.

## 4. Stop and report

Stop when the target is met and any requested cost cutting is done, the budget or iteration limit is reached, or several consecutive changes fail to improve the score. Report baseline, checkpoint and final scores in a table, what changed, the held-back result and where the eval lives. Use [writing-good-tests](../writing-good-tests/SKILL.md) to decide whether the eval becomes permanent coverage.
