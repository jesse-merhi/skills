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
```

The launcher executes the checked-in Effect TypeScript implementation. The
database stores records under:

```text
~/.local/state/agent-review-findings/reviews.sqlite
```

## Scope budget records

Start each new review run by freezing its user-authorized scope and direct-diff
baseline:

```sh
"$review_findings_bin" scope-start \
  --repo <repo> --repo-path <repo-root> --branch <branch> \
  --target <target> --base <base> --head <head> \
  --scope-summary "<request, behavior, owner boundary, and files>"
```

After every accepted fix and before another review pass, run:

```sh
"$review_findings_bin" scope-check \
  --repo <repo> --repo-path <repo-root> --branch <branch> \
  --target <target> --base <base> \
  --reason "<remaining work and why it may merit additional scope>"
```

A passing check prints the exact baseline, current production lines, allowed
growth, excluded test/generated lines, and frozen scope. A blocked check exits
non-zero and is an immediate stop: present its output to the user and do no more
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
diff.

After both review phases are clean and one final `scope-check` passes, close the
budget:

```sh
"$review_findings_bin" scope-complete \
  --repo <repo> --repo-path <repo-root> --branch <branch> \
  --target <target> --base <base> \
  --reason "<final native and cold-review result>"
```

An active budget blocks any second `scope-start` for the same repository and
branch. `scope-complete` releases that lock for a later user-authorized review.

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
- severity or priority when available
- scope class when useful: direct, induced, adjacent, or unrelated
- status: `open`, `fixed`, `rejected`, `deferred`, `provisional`, or `reopened`
- affected files or behavior
- impact category: `ui`, `workflow`, `api-contract`, `permissions`, `privacy`,
  `finance`, `data-correctness`, `audit`, `migration`, `schema`, or `internal`
- whether the finding is material to the review owner: mark material when it
  changes visible behavior, workflow, who can see/do what, data correctness,
  audit history integrity, billing/payroll/finance, schema/migrations, or API
  contracts
- user impact: one sentence explaining why a product/review owner should care
- short decision, evidence, and validation result

Record each finding as soon as it is triaged:

```sh
"$review_findings_bin" record \
  --repo <repo-display-name> \
  --repo-path <repo-root> \
  --branch <branch-or-review-key> \
  --target <PR-or-range> \
  --base <base> \
  --head <head> \
  --decision-id D<N> \
  --status <open|fixed|rejected|deferred|provisional|reopened> \
  --source <native-review|cold-review|lens|user> \
  --fingerprint "<file + code element + root cause>" \
  --summary "<one-sentence finding>" \
  --impact <ui|workflow|api-contract|permissions|privacy|finance|data-correctness|audit|migration|schema|internal> \
  --priority <P0|P1|P2|P3|P4> \
  --material \
  --user-impact "<why product/review owners should care, or empty for low-risk internal findings>" \
  --decision "<owner or next action>" \
  --text "<reason, evidence, impact, and validation notes>"
```

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

The summary reports totals, status, sources, impact areas, priorities, important
findings, unresolved work, and verification counts. Retrieve the complete audit
when writing or checking the summary:

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
