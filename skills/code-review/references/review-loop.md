# Discover, repair and verify

Keep one saved run across native review, repairs and independent review. Use the lifecycle batch commands from the main skill for normal starts and completed results. Keep model execution outside the transaction.

## Discover before editing

Record a `review-start` action using the current saved revision and exact committed head, then launch the requested reviewer once. The start checks scope and limits. If an invocation is already running, resume it. If interrupted, save its blocked result before another start; an empty or interrupted response is not clean.

Collect and adjudicate the whole native result before editing. Normally repair its accepted findings together, obtain the required final-head native result, then run the independent assessment. A single-phase request uses only its requested inventory.

Gather the independent inventory before repairs when a named unresolved flow or shared boundary could materially change the repair, and combining discoveries can avoid substantial rework. Record that concrete reason; PR size or a desire for extra reassurance is not enough. Keep dispatches serial so each saved start has its matching result. Give the independent reviewer the target, contracts and required lenses without native findings or judgments. Combine both inventories and their evidence before repairing; do not run a separate fix loop for each reviewer.

Map the affected behaviors from real entry points through state, dependencies and outcomes. Look for failure and recovery paths where the change can break its contract. Distinguish inspected code, executed behavior and unresolved coverage. File-read counts and the number of findings are not a completeness score.

The coordinator establishes and records each candidate using the findings guide, then saves one `review-result` batch with its outcome and any independent file-coverage attestations:

- `clean`: no supported findings or unresolved decisions remain in the run.
- `clean-except-queue`: only recorded owner questions remain.
- `findings`: supported findings still require repair.
- `blocked`: the review failed, was interrupted, examined the wrong code or lacks usable evidence.

During discovery, use `findings` while accepted issues from either inventory await repair, even when this reviewer adds none; preserve its actual result in the evidence artifact. A clean batch cannot leave an earlier finding open.

A newly reported candidate does not automatically override a previous rejection. Compare the actual evidence and revision. Preserve changed evidence and unresolved questions; do not convert uncertainty into either a repair or a clean claim.

## Repair together

Investigate the failed assumptions and their affected paths before editing, then repair related confirmed issues as a coherent batch. Apply the findings guide's evidence, permission and repair rules. A delegated repair worker changes code and returns proof; the coordinator owns registry, scope, commits and review scheduling.

Verify the repaired behavior, related paths and preserved behavior. Add useful regression coverage before delivery, using expected results from the contract. Save completed repair attempts and checks in a `repair-result` batch while the findings are still open. Check scope, inspect the combined diff and commit authorized review fixes together.

## Decide the next review

Use the saved targets: this workflow requests one clean native result and one clean independent result on the final head. An explicit single-phase or single-pass request remains limited to that scope. The executable's legacy defaults do not replace the targets frozen at setup.

Obtain the required clean native result and fresh independent assessment on the final head. If an independent discovery inventory ran before repairs, it does not replace independent assessment of the repaired head. Later repairs require both phase results on the new head. If discovery found no supported problems and the head is unchanged, its clean results already satisfy the requested targets; do not launch a second pair. Continue because the code changed, evidence is missing or a supported issue remains; do not repeat an unchanged completed phase merely to obtain another reassuring response. Domain lenses remain required, but they do not each require another agent.

Keep supporting evidence across passes when its relevant code, callers, dependency version, fixtures, configuration and environment remain applicable. Changed behavior invalidates its earlier proof. If impact cannot be bounded, broaden verification rather than assuming unrelated-looking files are unaffected.

## Stop honestly

Completion requires the requested final-head phases, applicable checks and resolution of supported findings and decisions. A spending or time limit ends work as incomplete. It does not erase findings, reset the run, waive checks or establish cleanliness. Preserve the patch, evidence and exact next action for a permitted continuation.
