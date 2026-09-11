# Record one lifecycle action

Use the coordinator's existing registry database and prepared checkout. Save JSON artifacts outside the reviewed repository. Repair workers return patches and evidence; they do not initialize another run or manage the registry.

Create `run.json` once from the scoped checkout:

```json
{"runId":"scope-start runId","repo":"owner/repo","repoPath":"/absolute/checkout","branch":"feature","target":"PR URL","base":"base SHA","head":"reviewed SHA"}
```

Update `head` only after committing a new revision; preserve earlier run files alongside their action files. Use the same database throughout. Read `review-findings batch-schema` for the machine contract and `review-findings schema` for rating and evidence requirements. The batch delegates to existing finding, coverage and progress functions; it cannot validate the truth of a finding.

```sh
review-findings batch --db <database> --run-file <run.json> --file <action.json>
```

The command returns a compact receipt with the saved revision. Use that revision in the next action. Keep a unique request ID for each actual action. Replaying the identical request returns its receipt; reusing an ID with different content fails. A conflict requires inspecting current progress, not retrying with a guessed revision.

## Start a review

```json
{"requestId":"native-1-start","expectedRevision":0,"action":{"kind":"review-start","phase":"native","evidence":"invocation reference"}}
```

Start the external reviewer only after this succeeds. A repeated start receipt is not authorization to launch again: resume the saved invocation. If the process never launched or was interrupted, record that blocked result before a new request.

## Save a completed review

```json
{"requestId":"native-1-result","expectedRevision":1,"action":{"kind":"review-result","phase":"native","evidence":"result artifact","outcome":"clean","findings":[]}}
```

Use `findings`, `clean-except-queue` or `blocked` when appropriate. Include every adjudicated candidate in `findings`, using the same named fields as the record schema. A clean batch with an active finding is rejected atomically. For independent coverage, supply `coverage` with the review ID, reviewer and observed `{path, changeId}` entries; context reads do not qualify. Preserve repeated-finding evidence through `record --match-of` for an open or rejected finding in the active run. Include the current revision and why the cause and counterevidence still apply. It appends evidence without reopening or replacing the earlier decision; changed facts require explicit re-adjudication.

## Save completed repairs and checks

A `repair-result` action has `phase`, a `repairs` array and a `checks` array. Each repair contains the full updated `finding`, a unique `attempt`, patch/verification `evidence`, and `unsuccessful`. A successful finding has status `fixed`; an unsuccessful attempt keeps it `open`. The command records the patch attempt before updating its finding. It refuses a third unsuccessful repair sequence without the existing owner-authorization event.

Each check contains `command`, `result`, `reason` and optional `decisionId`. Save checks that completed without a repair using a `checks` action. Results are records of observed commands, not instructions for the CLI to execute. Preserve the actual failing result and diagnose it; do not label a check passed because it was scheduled.

The transaction either saves the whole action or rolls it back. External processes and code edits are not rolled back. Keep their artifacts after an error and resolve the reported state before submitting a corrected action.
