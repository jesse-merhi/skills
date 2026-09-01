# Findings registry

The findings database is the working registry. The SQLite findings database is
the durable registry for every finding raised by native review, cold review,
required lenses, conditional lenses, native reviewers, the review owner, or
the user. Use it for finding IDs, branch/review keys, current status,
fingerprint, source, owner or next action, verification commands, closeout
sections, search, and the current open queue.

Do not rely on chat history as the source of review state.

## Helper

Use the Effect SQL `review-findings` CLI as the local SQLite search index for
review findings. Resolve `<skill-dir>` to the directory containing `SKILL.md`
and use the repo-owned launcher so the implementation cannot drift from the
skill instructions:

```sh
review_findings_bin="<skill-dir>/scripts/review-findings"
"$review_findings_bin" schema
```

Run `schema` before the first finding record in every review. Its output is the
authoritative, current contract for record fields, allowed values, and
likelihood-impact consistency rules. If an example or remembered prompt
disagrees with the CLI output, follow the CLI output.

The launcher executes the checked-in Effect TypeScript implementation. The
database stores records under:

```text
~/.local/state/agent-review-findings/reviews.sqlite
```

## Scope budget records

Start each new review run by freezing or inheriting its user-authorized scope
and direct-diff baseline:

```sh
"$review_findings_bin" scope-start \
  --repo <repo> --repo-path <repo-root> --branch <branch> \
  --target <target> --base <base> --head <head> \
  --scope-summary "<request, behavior, and owner boundary>"
```

Measuring a historical `--head` without checking it out requires Git 2.41 or
newer so binary attributes come from that target commit. On older Git, check out
the requested head first or update Git before starting the scope budget.

After every accepted fix and before another review pass, run:

```sh
"$review_findings_bin" scope-check \
  --repo <repo> --repo-path <repo-root> --branch <branch> \
  --target <target> --base <base> \
  --reason "<remaining work and why it may merit additional scope>"
```

A passing check prints the exact baseline, current production lines, allowed
growth, exclusions, frozen scope, and informational text paths. A blocked check exits
non-zero for line overage or a new binary path: present its output and do no more
review or patch work.

Only after the user explicitly approves a larger scope, record their words and
the revised scope:

```sh
"$review_findings_bin" scope-authorize \
  --repo <repo> --repo-path <repo-root> --branch <branch> \
  --target <target> --base <base> --head <head> \
  --scope-summary "<revised scope>" \
  --authorization "<user's explicit approval>"
```

Use `scope-status` after compaction or handoff. `scope-start` refuses to replace
an existing baseline or create a second active baseline under a renamed target,
and `scope-authorize` refuses to run until a check has blocked. Keep the database
outside the reviewed repository so its SQLite files cannot enter the measured
diff. The exception is a migrated budget whose status says rebaseline is
required: after showing that reason and receiving explicit approval, run
`scope-authorize` directly because `scope-check` intentionally cannot clear the
migration state.

After both review phases are clean and one final `scope-check` passes, close the
budget:

```sh
"$review_findings_bin" scope-complete \
  --repo <repo> --repo-path <repo-root> --branch <branch> \
  --target <target> --base <base> \
  --reason "<final native and cold-review result>"
```

An active budget blocks any second `scope-start` for the same repository and
branch. `scope-complete` releases that lock for a later user-authorized review,
but the later run inherits the original branch-and-base LOC, paths, allowance,
and already-consumed growth. It does not receive another percentage buffer.

## Finding records

Write finding cards for the review owner, not for the reviewer that discovered
them. Before recording each batch, apply the `speak-fking-english` reader reset
without changing the technical claim:

- `summary`: say what can go wrong and where; restore the premise needed to
  understand it
- `user-impact`: say who experiences the consequence and what happens
- `decision`: say what changed, why the finding was rejected, or what decision
  remains

Use everyday language and concrete behavior. Keep engine names, severity,
fingerprints, and implementation detail in their structured fields instead of
making the owner decode reviewer shorthand.

For every finding, record:

- decision ID
- source: native review, cold review, named lens, review
  owner, or user
- CLI-derived severity when available
- scope class when useful: direct, induced, adjacent, or unrelated
- status: `open`, `fixed`, `rejected`, `deferred`, `provisional`, or `reopened`
- affected files or behavior
- area: `ui`, `workflow`, `api-contract`, `permissions`, `privacy`,
  `finance`, `data-correctness`, `audit`, `migration`, `schema`, or `internal`
- whether the finding is material to the review owner: mark material when it
  changes visible behavior, workflow, who can see/do what, data correctness,
  audit history integrity, billing/payroll/finance, schema/migrations, or API
  contracts
- user impact: one sentence explaining why a product/review owner should care
- finding kind: `runtime` for a claim about reachable product behavior or
  `maintenance` for code-quality work without a runtime failure claim
- fix scope: `local` when the owning boundary can be fixed directly, or
  `systemic` when a local edit would be a Band-Aid; contained systemic repairs
  may use `fix`, while material systemic repairs use `consult`
- handling: `fix` for current in-scope work, `consult` for an owner decision,
  `follow-up` for real nonblocking work outside this review, or `reject` when a
  candidate fails an actionability gate
- risk rating for runtime candidates: production path, reachability evidence,
  likelihood, impact, and actual consequence; the CLI derives severity and
  disposition
- contract evidence for every actionable runtime finding
- root cause and intervention justification for every actionable runtime or
  maintenance finding; patches and deferrals also require a recommended repair,
  while unresolved or declined consultation may record why no repair is supported
- rejection gate for rejected candidates: `reality`, `importance`, `contract`,
  `repair`, or `duplicate`
- short decision and validation result
- explicit owner resolution when a consultation or provisional fix reaches a
  terminal state

Record each finding as soon as it is triaged. Use this runtime template only
after the candidate derives an actionable finding:

```sh
"$review_findings_bin" record \
  --repo <repo-display-name> \
  --repo-path <repo-root> \
  --branch <branch-or-review-key> \
  --target <PR-or-range> \
  --base <base> \
  --head <head> \
  --decision-id D<N> \
  --finding-kind runtime \
  --status <open|fixed|deferred|provisional|reopened> \
  --fix-scope <local|systemic> \
  --handling <fix|consult|follow-up> \
  --source <native-review|cold-review|lens|user> \
  --fingerprint "<file + code element + root cause>" \
  --summary "<one-sentence finding>" \
  --area <ui|workflow|api-contract|permissions|privacy|finance|data-correctness|audit|migration|schema|internal> \
  --material \
  --user-impact "<why product/review owners should care, or empty for low-risk internal findings>" \
  --production-path "<current producer -> transformations -> failing sink>" \
  --reachability-evidence "<observed payload, current contract, or repository invariant>" \
  --likelihood <likely|possible|rare> \
  --impact <critical|high|medium|low> \
  --actual-consequence "<verified behavior and meaningful user/system impact>" \
  --contract-evidence "<current contract and evidence that the behavior violates it>" \
  --root-cause "<underlying cause and owning boundary>" \
  --recommended-fix "<smallest durable repair at the owning boundary>" \
  --intervention-justification "<why this is better than doing nothing after full repair cost>" \
  --decision "<owner or next action>" \
  --text "<validation notes or other searchable context>"
```

Record an `unknown` runtime candidate as an investigation without inventing
repair fields:

```sh
"$review_findings_bin" record \
  --repo <repo-display-name> --repo-path <repo-root> \
  --branch <branch-or-review-key> --target <PR-or-range> --base <base> \
  --head <head> --decision-id D<N> \
  --finding-kind runtime --status open --fix-scope <local|systemic> \
  --handling <fix|consult|follow-up> --source <native-review|cold-review|lens|user> \
  --fingerprint "<file + code element + unproven risk>" \
  --summary "<candidate that still needs proof>" \
  --likelihood unknown --impact <critical|high|medium|low> \
  --decision "<specific evidence to obtain and who owns it>" \
  --text "<current evidence and missing proof>"
```

Record an unreachable runtime candidate without repair fields:

```sh
"$review_findings_bin" record \
  --repo <repo-display-name> --repo-path <repo-root> \
  --branch <branch-or-review-key> --target <PR-or-range> --base <base> \
  --head <head> --decision-id D<N> \
  --finding-kind runtime --status rejected --fix-scope <local|systemic> \
  --handling reject --source <native-review|cold-review|lens|user> \
  --fingerprint "<file + code element + unreachable risk>" \
  --summary "<candidate that no supported producer can reach>" \
  --likelihood theoretical \
  --impact <critical|high|medium|low> \
  --rejection-gate reality \
  --decision "<why no supported producer can reach the candidate>" \
  --text "<supporting evidence>"
```

For a reachable candidate rejected at a later gate, include the runtime evidence
but omit repair fields:

```sh
"$review_findings_bin" record \
  --repo <repo-display-name> --repo-path <repo-root> \
  --branch <branch-or-review-key> --target <PR-or-range> --base <base> \
  --head <head> --decision-id D<N> \
  --finding-kind runtime --status rejected --fix-scope <local|systemic> \
  --handling reject --source <native-review|cold-review|lens|user> \
  --fingerprint "<file + code element + rejected risk>" \
  --summary "<reachable candidate that failed a later gate>" \
  --production-path "<current producer -> transformations -> observed sink>" \
  --reachability-evidence "<current contract, payload, or repository invariant>" \
  --likelihood <likely|possible|rare> --impact <critical|high|medium|low> \
  --actual-consequence "<verified behavior and affected party>" \
  --rejection-gate <importance|contract|repair|duplicate> \
  --decision "<why the candidate failed that gate>" \
  --text "<supporting evidence>"
```

`unknown` always derives an open investigation. `theoretical` is the rejection
state when no supported producer can reach the candidate.

Use a maintenance record for unnecessary changed code:

```sh
"$review_findings_bin" record \
  --repo <repo-display-name> \
  --repo-path <repo-root> \
  --branch <branch-or-review-key> \
  --target <PR-or-range> \
  --base <base> \
  --head <head> \
  --decision-id D<N> \
  --finding-kind maintenance \
  --status <open|fixed|deferred|provisional|reopened> \
  --fix-scope <local|systemic> \
  --handling <fix|consult|follow-up> \
  --source <native-review|cold-review|lens|user> \
  --fingerprint "<file + code element + root cause>" \
  --summary "<one-sentence finding>" \
  --maintenance-evidence "<repository proof of unnecessary complexity, duplication, or code with no current job>" \
  --present-cost "<current reading, change, test, or ownership cost>" \
  --root-cause "<underlying cause and owning boundary>" \
  --recommended-fix "<smallest durable repair at the owning boundary>" \
  --intervention-justification "<why this is better than doing nothing after full repair cost>" \
  --decision "<owner or next action>" \
  --text "<validation notes or other searchable context>"
```

`--branch` and `--base` may be omitted when the repository and target identify
exactly one existing run. If more than one run matches, the CLI rejects the
record and requires both fields instead of guessing.

Runtime records must omit the two maintenance evidence flags. Maintenance
records must omit all six runtime evidence and risk flags. To reject an unsupported
maintenance candidate, use `--status rejected`, omit both maintenance evidence
flags, record `--rejection-gate`, and record the rejection rationale in
`--decision`. Rejected runtime candidates use the same rejection-gate rule and
omit repair fields.

Do not pass priority, severity, or disposition. The CLI derives severity and
disposition from the current likelihood-impact matrix, evidence, and required
`--handling`. Handling routes proven work but cannot raise a rejected or
unproven risk. Actionable records require root cause and intervention
justification. A patch, deferral, or approved consultation also requires a
recommended repair; an unresolved consultation instead records the repair
question, directions checked, and why no recommendation is supported. Rejected
and investigating candidates must omit repair fields. A systemic
finding may use `fix` only after `review-guardrails` classifies its durable
repair as contained; material systemic repairs use `consult` and wait for an
owner decision. `follow-up` requires deferred status plus an owner or next
action, stays nonblocking, and appears under `Deferred work`. `reject` requires
a rejected record, `--rejection-gate`, and a decision explaining why the
candidate failed that gate. An accepted local
finding handled as `fix` and recorded as deferred becomes residual risk and
requires `--decision` to explain why that risk is accepted.
A consulted finding may be marked fixed or rejected only
with `--owner-resolution approved|declined` and `--decision` containing the
owner's decision. Use the same explicit resolution when the owner keeps a
provisional fix. If the owner declines a provisional repair, revert it and
record the accepted finding as `reopened` with `--decision`; omit
`--owner-resolution` because the finding remains active. A consulted finding
may be deferred only with
`--owner-resolution declined` and the owner's decision; an unanswered consult
stays open. An owner-resolved current-schema record is terminal and immutable.
Repeating the exact record is harmless, including after scope completion;
changing any field requires a new decision ID. Active legacy findings remain
open until re-recorded with current evidence; an evidence-only upgrade must
preserve the status, source identity, owner decision, disposition, fix scope,
and handling. Completed legacy history stays terminal and is labelled legacy.
Closeout lists follow-ups and owner-declined
consults under `Deferred work`, accepted local risk under `Accepted residual
risk`, and unresolved decisions under `Still open`.

Query before dispatching subagents, resuming a review, or answering "what did
review find?":

```sh
"$review_findings_bin" query --repo <repo> --repo-path <repo-root> --branch <branch> --target <current-target> "<search text>"
"$review_findings_bin" query --repo sample-app --repo-path <repo-root> --branch <branch> --target <current-target> --status open "tenant invoice leak"
"$review_findings_bin" query --repo sample-app --repo-path <repo-root> --branch <branch> --target <current-target> --json "blocked consult payment reversal"
```

## Validation records

Record each validation command as soon as it finishes:

```sh
"$review_findings_bin" record-command \
  --repo <repo-display-name> \
  --repo-path <repo-root> \
  --branch <branch-or-review-key> \
  --target <PR-or-range> \
  --base <base> \
  --command "<command>" \
  --result "<passed|failed|blocked + key result>" \
  --reason "<finding ID or risk this command checked>" \
  --decision-id D<N>
```

Example:

```sh
"$review_findings_bin" record-command --repo sample-app --repo-path <repo-root> --branch <branch> --target <target> --base <base> --command "bun run test -- refunds" --result passed --reason "Checks D1 duplicate refund guard." --decision-id D1
```

## Closeout

After compaction, handoff, or a long review, rebuild the owner summary from
SQLite instead of chat history:

```sh
"$review_findings_bin" closeout --summary \
  --repo <repo> \
  --repo-path <repo-root> \
  --branch <branch> \
  --base <base> \
  --target <current-target>
```

The summary reports totals, status, sources, source-by-disposition outcomes,
rejection gates, impact areas, severities, important findings, unresolved work,
and verification counts. Use source outcomes and rejection gates to compare
native and cold-review precision over time. Retrieve the complete audit when
writing or checking the summary:

```sh
"$review_findings_bin" closeout --json \
  --repo <repo> \
  --repo-path <repo-root> \
  --branch <branch> \
  --base <base> \
  --target <current-target>
```

Use the material view when investigating the important finding cards in more
detail:

```sh
"$review_findings_bin" closeout --material \
  --repo <repo> \
  --repo-path <repo-root> \
  --branch <branch> \
  --base <base> \
  --target <current-target>
```

Prune stale low-use findings periodically:

```sh
"$review_findings_bin" prune --older-than-days 90 --min-seen-count 1
```

The CLI combines SQLite FTS5 with a local hashed vector index over compact
issue cards. The structured SQLite rows remain the source for status, target,
branch, decision ID, file, owner, and verification records. Older findings rank
lower unless they are re-recorded or returned by searches often enough to raise
their seen count. `prune` removes old low-use findings from the local index.

## Changed-file coverage

File coverage is a priority ledger, not a clean gate. The CLI deterministically
builds the current changed-file manifest from the frozen base and current target.
Each file identity includes its exact diff content, so an edit invalidates prior
coverage without deleting its history.

Before dispatching general review or discovery agents, query the current order:

```sh
"$review_findings_bin" coverage-status --json \
  --repo <repo> --repo-path <repo-root> --branch <branch> \
  --target <target> --base <base>
```

The result ranks `stale` and `unreviewed` files first, then `reviewed-once`,
then `reviewed-twice`. Use that order to assign work. Do not tell a cold reviewer
that lower-priority files were approved; give it the assigned files or flows
without prior verdicts or counts. Keep each assigned file's `changeId`; it binds
the later attestation to the exact content the reviewer received.

At the end of one general review invocation, record all substantively reviewed
changed files in one command:

```sh
"$review_findings_bin" coverage-record \
  --repo <repo> --repo-path <repo-root> --branch <branch> \
  --target <target> --base <base> \
  --review-id "<phase + iteration + agent/session ID>" \
  --reviewer "<cold-review|discovery|general-review>" \
  --file <path> [--file <path> ...] \
  --change-id <observed-change-id> [--change-id <observed-change-id> ...]
```

Pass one `--change-id` for each `--file`, in the same order. The command rejects
the whole batch if any file changed after the reviewer observed it.
Coverage also stops explicitly for non-UTF-8 Git paths or dirty nested
repositories because their content cannot be represented or identified exactly.
One review ID counts at most once per file, including idempotent retries. Use a
new review ID only for a genuinely independent review invocation. Record a file
only when the reviewer assessed its changed behavior for actionable correctness
or maintenance findings. Merely listing it, opening it for context, classifying
it through a narrow lens, or seeing it in a whole-repository diff does not count.
The CLI rejects paths outside the current changed-file manifest.
