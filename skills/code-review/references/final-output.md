# Final Output

Every closeout must be backed by the findings CLI. Before writing the final
answer, resolve `review_findings_bin` from `AGENT_REVIEW_FINDINGS_BIN` or
`<skill-dir>/scripts/review-findings`, record each validation command with
`"$review_findings_bin" record-command`, then run:

```sh
"$review_findings_bin" closeout --repo <repo> --repo-path <repo-root> \
  --branch <branch> --base <base> --target <current-target>
```

Use its output as the source for these exact sections:

- `Material findings`: owner-facing review findings that change visible
  behavior, workflows, permissions, data correctness, audit/history,
  billing/payroll/finance, migrations/schema, or API contracts. Lead with this
  section when it has entries.
- `User-visible or workflow changes`: UI, route, API, or workflow changes made
  while reviewing that the review owner may notice or want to inspect.
- `Security, data, and permission changes`: auth, privacy, finance,
  data-correctness, audit/history, and migration/schema changes.
- `Lower-risk findings`: internal edge cases, tests, and helper fixes. Keep this
  concise; do not let it bury the material findings.
- `Findings found`: finding IDs, source, status, and one-sentence summary. Say
  `none` only when the CLI has no recorded actionable findings.
- `Changes made while reviewing`: files/functions changed because of review
  findings, mapped back to finding IDs. Say `none` only when the CLI has no
  recorded fixed findings.
- `Verification run`: commands run, pass/fail result, and which finding or risk
  each command checked. This must come from recorded CLI command rows.
- `Still open`: consult queue, deferred findings, skipped validation, and
  residual risk.

Do not invent or reconstruct those sections from chat history. If the CLI output
is incomplete, record the missing finding or command first, rerun
`"$review_findings_bin" closeout`, then answer.

For a concise owner-facing answer, run:

```sh
"$review_findings_bin" closeout --material --repo <repo> --repo-path <repo-root> \
  --branch <branch> --base <base> --target <current-target>
```

Summarize that output before the full verification details.

Include the `"$review_findings_bin" query` command that can retrieve the
recorded findings for this repo/branch/target.

Report iterations, the Phase 1 engine used, `review-until-clean` result,
`cold-pr-review-until-clean` result, `Findings found`, `Changes made while
reviewing`, `Verification run`, `Still open`, PR evidence, required-lens
results, PR URL or PR blocker, `pr-proof-pack` result, context updates, the
configured `review-findings closeout` command used, findings database query
command, structured JSON ledger path when one was written, budget use (elapsed
wall clock and diff growth against the baseline), the consult queue awaiting the
review owner, final verdict, and anything left for human judgment.

When clean, say plainly that both phases were clean on the same final target,
including the same dirty-tree/snapshot identity when local overlay changes were
present, that the required review lenses were completed, and name real test gaps
or residual risk. If the last review pass had no findings, phrase that as the
final clean confirmation, not as the whole review outcome unless the findings
registry is empty.

At closeout, use the material sections first:

- `Material findings`
- `User-visible or workflow changes`
- `Security, data, and permission changes`
- `Lower-risk findings`

Then use the full sections:

- `Findings found`
- `Changes made while reviewing`
- `Verification run`
- `Still open`

Summarize the whole recorded run, not just the last clean pass. If the final
clean confirmations reported no remaining findings, say that as "the final pass
had no remaining findings" after the registry summary. Do not write a final
report that only says `No findings` unless no reviewer, lens, or user-raised
finding appeared anywhere in the whole run.
