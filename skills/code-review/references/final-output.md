# Final Output

Rebuild every closeout from the findings database. Do not rely on chat memory,
especially after compaction. Resolve `review_findings_bin` as
`<skill-dir>/scripts/review-findings`; never use the retired
`AGENT_REVIEW_FINDINGS_BIN` override. Record final validation, then run both:

```sh
"$review_findings_bin" closeout --summary --repo <repo> --repo-path <repo-root> \
  --branch <branch> --base <base> --target <current-target>
"$review_findings_bin" closeout --json --repo <repo> --repo-path <repo-root> \
  --branch <branch> --base <base> --target <current-target>
```

Use the summary for structure and the JSON audit to verify that no finding was
lost. If either is incomplete, repair the database records before answering.

Write a short owner report:

Before these sections, state the exact reviewed head SHA and target, or the
dirty snapshot identity. A later PR workflow must be able to compare this
identity with the current head without relying on chat memory or CI state.

1. **Outcome:** clean, blocked, or incomplete; whether the final push and CI
   completed.
2. **What review found:** total and status counts, then group every finding into
   a small number of plain-language themes. Give each theme a count and its
   finding IDs so the counts reconcile with the complete audit. Explain the
   highest-impact findings and their fixes. Do not print hundreds of repetitive
   cards.
3. **Still open:** decisions, deferred work, failed or skipped validation, and
   residual risk.
4. **Delivery:** final local validation, proof freshness result, PR URL or owner
   blocker, CI state, and the required thumbs-up sign-off.
5. **Full audit:** include the exact `closeout --json` or scoped `query` command
   that retrieves every persisted finding.

Say that the final pass had no remaining findings only after summarizing the
whole run. Do not reduce a review that found and fixed problems to “no
findings.”

Run the complete draft through `speak-fking-english`. Preserve finding counts,
IDs, outcomes, and risk while removing reviewer jargon and repeated sections.
