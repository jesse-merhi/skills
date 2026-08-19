# Uncertain Findings

Use this workflow only after `finding-discipline`'s risk rating returned
`accept`. It handles uncertainty about the repair, not uncertainty about whether
the risk exists. A candidate with unproven reachability or consequence remains
`investigate` or `consult`; do not apply a provisional fix.

Some accepted findings still have an uncertain repair: contested between
passes or a judgment call about implementation. Never silently fix or silently
reject one.

Use the provisional-fix test. All four checks must hold:

1. **Root cause**: the fix removes the failure mode, not the symptom or the
   reviewer's report of it. Suppressing an error path, papering a null check
   over a broken invariant, or tweaking a condition to dodge the reported case
   all fail.
2. **Right altitude**: the fix lands where the invariant lives. A special case
   added to shared infrastructure to protect one caller fails
   (`improve-codebase-architecture` has the long form).
3. **Small and local**: within the diff-growth budget and inside the mapped
   review surface.
4. **Cleanly reversible**: one commit or hunk whose revert restores the original
   exactly.

## Provisional Fix: Class A

When the test passes:

- Apply the fix now and record it as status `provisional` in the findings
  database.
- Ask the user in parallel; do not wait for the answer.
- Continue the loop on the fixed tree so later passes review the actual state.
- If the user keeps it, close the entry.
- If the user rejects it, revert the commit or hunk, reset the streak, and
  resume.

## Consult: Class B

When the test fails, consult instead. This includes cases where the only
available fix is a bandaid, the direction is the user's call (product, security
posture, data migration), or the fix would break a budget or the review surface.

Add the finding to `consult_queue` with a fingerprint: file, code element, and a
one-sentence root cause. Raise it with the user without waiting: immediately
when the user is active, otherwise in the suspension or final report. Keep
fixing other findings.

In Claude Code use the question tool. In Codex, ask in the reply.

## Consult Cap

The consult cap bounds how much uncertainty may pile up. When open questions for
the user reach `consult_cap` (default 5, counting open Class B entries plus
provisional fixes still awaiting keep-or-revert), suspend as blocked-on-consult
before starting another review cycle.

Present all open questions in one batch and resume after the answers. A
machine-local override may change the cap's value.
