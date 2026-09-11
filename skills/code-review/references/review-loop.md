# Review, repair and verify

Keep one saved run. Use `review native` or `review start` on the exact committed head, then wait for that invocation. An interrupted, empty or unusable result is `blocked`, never clean.

## Finish discovery before repairs

Collect and adjudicate the entire native result before editing. Normally repair its accepted findings together, obtain the required native result on the repaired head, then run independent review. Honor single-phase and single-pass requests.

Gather independent findings before repairs only when a named unresolved flow or shared boundary could materially change the repair. Record that reason; size or reassurance alone is insufficient. Dispatch serially, keep native findings out of the independent brief, and combine both inventories before repairing.

Assess changed behavior from real entry points through state, dependencies, failure and recovery to outcomes. Distinguish inspected code, executed behavior and unresolved coverage; file counts and finding counts do not prove completeness.

Record all findings, repeated reports and coverage in one code-mode call, checking each command. Then use `review finish` with the outcome:

- `clean`: no supported findings or unresolved decisions remain.
- `clean-except-queue`: only recorded owner questions remain.
- `findings`: accepted issues still await repair, including issues from an earlier inventory.
- `blocked`: the review failed, was interrupted, examined the wrong code or lacks usable evidence.

Preserve this reviewer's actual result in its artifact even when earlier issues determine the run's outcome. Repeated claims require comparing current evidence with prior counterevidence, not automatically reversing a rejection.

## Repair shared causes

Apply the findings guide to the full accepted inventory. Repair related causes together, verify affected and preserved behavior, then record the attempts and results through the review commands. Record each attempt before closing its finding. Check scope, inspect the combined diff and commit authorized repairs together. Repair workers return patches and evidence; the coordinator owns the registry and review scheduling.

## Review the final code

Require the phase targets frozen at setup: normally one clean native and one clean independent result on the final head. An earlier independent discovery pass does not cover later repairs. A new repair invalidates both final-head phase results; an unchanged clean discovery result already counts. Domain lenses do not each require another agent.

Reuse supporting proof only while its relevant code, callers, dependencies, fixtures, configuration and environment still apply. Broaden verification when the impact cannot be bounded.

Complete only after the requested reviews, applicable checks and decisions are resolved. A spending or time limit leaves work incomplete: preserve the patch, evidence and next action without resetting the run or waiving findings.
