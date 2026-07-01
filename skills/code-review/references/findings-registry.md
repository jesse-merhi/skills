# Findings Registry

The findings database is the working registry. The SQLite findings database is
the durable registry for every finding raised by native review, cold review,
required lenses, conditional lenses, structured reviewers, the review owner, or
the user. Use it for finding IDs, branch/review keys, current status,
fingerprint, source, owner or next action, verification commands, closeout
sections, search, and the current open queue.

Do not rely on chat history as the source of review state.

## Helper

Use the Rust `review-findings` binary as the local SQLite search index for
review findings. Prefer the installed Rust binary. If it is missing, resolve
`<skill-dir>` to the directory containing `SKILL.md`, then install it once:

```sh
<skill-dir>/scripts/install-review-findings
```

It installs to `~/.local/bin/review-findings` by default. If
`AGENT_REVIEW_FINDINGS_BIN` is configured, prefer that absolute helper path so
an older `review-findings` earlier on `PATH` cannot be used by accident. If no
configured path exists, use the skill-local launcher:

```sh
review_findings_bin="${AGENT_REVIEW_FINDINGS_BIN:-<skill-dir>/scripts/review-findings}"
```

The checked-in launcher prefers a stamped installed binary and otherwise
builds/runs the bundled Rust source. The database stores records under:

```text
~/.local/state/agent-review-findings/reviews.sqlite
```

## Finding Records

For every finding, record:

- decision ID
- source: native review, cold review, named lens, structured reviewer, review
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

## Validation Records

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
"$review_findings_bin" record-command --repo sample-app --repo-path <repo-root> --branch <branch> --target <target> --base <base> --command "pnpm test refunds" --result passed --reason "Checks D1 duplicate refund guard." --decision-id D1
```

## Closeout

Generate the final closeout sections from SQLite, then use that output in the
user-facing final answer:

```sh
"$review_findings_bin" closeout \
  --repo <repo> \
  --repo-path <repo-root> \
  --branch <branch> \
  --base <base> \
  --target <current-target>
```

For a concise owner-facing overview, use the material view:

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
