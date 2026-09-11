# Submit a complete review

The coordinator uses one database and saves action files outside the checkout. Create `run.json` from `scope-start` and the reviewed commit:

```json
{"runId":"saved run ID","repo":"owner/repo","repoPath":"/absolute/checkout","branch":"feature","target":"PR URL","base":"base SHA","head":"reviewed SHA"}
```

After a new commit, update `head` and preserve the earlier files. Read `review-findings batch-schema` for action fields and `review-findings schema` for rating requirements.

```sh
review-findings batch --db <database> --run-file <run.json> --file <action.json>
```

Use each returned revision in the next action and a unique request ID per action. Identical replay returns the receipt without repeating writes. On a conflict, inspect saved progress before correcting the request.

## Start once, submit once

```json
{"requestId":"native-1-start","expectedRevision":0,"action":{"kind":"review-start","phase":"native","evidence":"invocation reference"}}
```

Launch only after the start succeeds. A replayed receipt means resume that invocation, not launch again. Save a `blocked` result if it never launched or was interrupted.

Finish the assessment, adjudicate every candidate, then submit one `review-result` before editing:

```json
{"requestId":"native-1-result","expectedRevision":1,"action":{"kind":"review-result","phase":"native","evidence":"complete report","outcome":"clean","findings":[],"matches":[]}}
```

Include accepted, rejected and uncertain candidates in `findings`. Put repeated reports in `matches` with `matchOf`, `source`, `evidence` and `matchNote`. Include independent file attestations in `coverage`. A pending batch review rejects individual `record`, `coverage-record` and `progress-record` commands. Completion accepts one result; completeness of the assessment remains the reviewer's responsibility.

The transaction saves everything or nothing. A denied start preserves its scope-block diagnostic for authorization, without recording a start. Keep external artifacts after errors; the transaction cannot undo processes or edits.

## Repairs and checks

Use `repair-result` for verified repairs and their checks, submitting while the findings are still open. Each repair includes the full updated `finding`, unique `attempt`, observed `evidence` and `unsuccessful`: false requires `fixed`, true requires `open`. Two failed attempts require owner authorization before a third.

Use a `checks` action for other completed validation. Record actual commands and results; the CLI does not run them. Individual commands remain available after the review result for owner decisions and exceptional transitions.
