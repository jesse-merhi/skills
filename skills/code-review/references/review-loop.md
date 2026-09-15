# Review, repair and verify

Keep one saved run. Each `review native` or `review start` invocation targets an exact committed candidate. Wait for that invocation; an interrupted, empty or unusable result is `blocked`, never clean. A later candidate may reuse completed evidence only after the applicability assessment below.

## Finish discovery before repairs

Collect and adjudicate the entire native result before editing. Normally repair its accepted findings together, establish applicable required native evidence for the repaired candidate, then establish independent evidence. Honor single-phase and single-pass requests.

Gather independent findings before repairs only when a named unresolved flow or shared boundary could materially change the repair. Record that reason; size or reassurance alone is insufficient. Dispatch serially, keep native findings out of the independent brief, and combine both inventories before repairing.

Assess changed behavior from real entry points through state, dependencies, failure and recovery to outcomes. Distinguish inspected code, executed behavior and unresolved coverage; file counts and finding counts do not prove completeness.

Checkpoint available assessed findings and probe evidence through the review commands. Reconcile findings, meaningful repeated reports and coverage before completion, checking each command. Then use `review finish` with the outcome:

- `clean`: no supported findings or unresolved decisions remain.
- `clean-except-queue`: only recorded owner questions remain.
- `findings`: accepted issues still await repair, including issues from an earlier inventory.
- `blocked`: the review failed, was interrupted, examined the wrong code or lacks usable evidence.

Preserve this reviewer's actual result in its artifact even when earlier issues determine the run's outcome. Repeated claims require comparing current evidence with prior counterevidence, not automatically reversing a rejection.

## Repair shared causes

Apply the findings guide to the full accepted inventory. After interruption, use the review commands to recover supported evidence and retain the incomplete history before repairing; final-candidate applicability requirements still apply. Repair related causes together, verify affected and preserved behavior, then record the attempts and results through the review commands. Record each attempt before closing its finding. Check scope, inspect the combined diff and commit authorized repairs together. Repair workers return patches and evidence; the coordinator owns the registry and review scheduling.

## Establish evidence for the final candidate

Keep the phase targets frozen at setup. Each required phase must meet its configured clean target through results applicable to the final candidate; normally this is one clean native and one clean independent result. A result may have been produced on an earlier candidate when the recorded assessment shows that its reviewed behavior and integration still apply. Do not relabel inherited evidence as a fresh review of the new candidate.

Favor reusing completed reviews. Assess changes since the last reviewed candidate and require further review only for a concrete reason: an invalidated conclusion or a gap in applicable required evidence. Use your judgment to decide what investigation or validation is needed, and record the reasoning.

A repair invalidates only evidence whose reviewed behavior or assumptions it changes. New findings or fixes reopen the affected evidence and checks, while unrelated completed evidence remains available. An earlier independent discovery pass does not cover a later repair that affects its scope. Domain lenses do not each require another agent. The registry keeps separate pass counts and clean streaks per phase.

Pin the candidate throughout assessment and review. If it changes while either is running, preserve the result against the candidate it actually examined, discard any incomplete applicability decision, and assess the new candidate. Complete only when the current candidate has applicable required phases, checks and resolved decisions.

Complete only after the requested reviews, applicable checks and decisions are resolved. An explicit user spending limit or task deadline leaves work incomplete: preserve the patch, evidence and next action without resetting the run or waiving findings.
