# Uncertain findings

Use this workflow only after the evidence proves the finding and the findings
CLI returned `accept` or `consult`: from `finding-discipline`'s risk rating for
a runtime candidate, or from maintenance and present-cost evidence for a maintenance candidate.
It handles uncertainty about the repair, not uncertainty about whether the
finding exists. A runtime candidate with unproven reachability or consequence
remains `investigate`; do not apply a provisional fix.

Some proven, important findings still have an uncertain repair: contested
between passes or a judgment call about implementation. An accepted risk rating
does not authorize a provisional patch. First apply `finding-discipline`'s
repair-quality gate. Never silently fix or silently reject one.

Use the provisional-fix test only for an `accept` finding after a recommended
direction passes the repair-quality gate. All four checks must hold:

1. **Root cause**: the fix removes the failure mode, not the symptom or the
   reviewer's report of it. Suppressing an error path, papering a null check
   over a broken invariant, or tweaking a condition to dodge the reported case
   all fail.
2. **Right altitude**: the fix lands where the invariant lives. A special case
   added to shared infrastructure to protect one caller fails
   (`improve-codebase-architecture` has the long form).
3. **Small and local**: within the diff-growth budget and inside the mapped
   review boundary.
4. **Cleanly reversible**: one commit or hunk whose revert restores the original
   exactly.

## Provisional fix: class A

When the test passes:

- Apply the fix now and record it as status `provisional` in the findings
  database.
- Notify the user promptly without pausing independent loop work. Keep the
  entry open; an unanswered notification is not approval.
- Continue the loop on the fixed tree so later passes review the actual state.
- If the user keeps it, close the entry as `fixed` with
  `--owner-resolution approved` and the user's decision text.
- If the user rejects the repair, revert the commit or hunk, reset the streak,
  and resume. Record the entry as `reopened` with the user's decision text and
  omit `--owner-resolution`: the repair was declined, but the finding remains
  active.

## Consult: class B

When the test fails, consult instead. This includes cases where the only
available fix is a bandaid, the direction is the user's call (product, security
posture, data migration), or the fix would break a budget or the review
boundary.

Add the finding to `consult_queue` with a fingerprint: file, code element, and a
one-sentence root cause. Raise it promptly when the user is active, continue
only independent work, and keep the entry open until the user approves,
rejects, or defers it. When no independent work remains, the clean target is
reached, or the consult cap is hit, suspend and present every open question.

In Claude Code use the question tool. In Codex, ask in the reply.

## Consult cap

The consult cap bounds how much uncertainty may pile up. When open questions for
the user reach `consult_cap` (default 5, counting open Class B entries plus
provisional fixes still awaiting keep-or-revert), suspend as blocked-on-consult
before starting another review cycle.

Present all open questions in one batch and resume after the answers. A
machine-local override may change the cap's value.
