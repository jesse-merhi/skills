---
name: openclaw-pr-readiness
description: 'Prepare or assess openclaw/openclaw PRs for exact-head proof, review, CI, and the scoped ClawSweeper gate. Use when publishing, updating, or preparing an OpenClaw PR for review or merge.'
---

# OpenClaw PR readiness

Make the review packet and all required gates describe the same current
`openclaw/openclaw` PR state. First verify that exact base repository; otherwise
return `not-applicable` without loading the rest of the workflow.

This skill does not authorize publication. The caller must already authorize
pushes/PR updates; that authority permits only the exact machine comment owned
by `clawsweeper-until-clean`, not prose comments, manual rating labels, reactions,
merge/automerge, deployments, or unrelated cleanup. ClawSweeper supplements
exact-head `code-review`, current proof, CI, repository requirements, maintainer
approval, and Jesse's sign-off; it replaces none of them.

Keep the patch focused, resolve actionable correctness/security findings using
repo-owned behavior and focused regression proof, and separate pinned merge-base-
to-head PR changes from base drift. An endpoint comparison is not the PR diff.
Use the normal non-force flow to reach the expected base and complete relevant
exact-head checks. Expose owner-held product/compatibility decisions instead of
expanding scope to chase ratings.

Load `pr-proof-pack` and refresh stale current-head proof. Prefer observed behavior
at the changed boundary; keep textual behavior copyable. Screenshots/recordings
serve visual or interactive claims only, and linked artifacts must contain
inspectable evidence. Runtime/auth/network/security/lifecycle claims need relevant
diagnostics, traces, logs, or live output. Tests/mocks/CI support rather than
replace real-behavior evidence.

Load `clawsweeper-until-clean`; it alone owns the comment, three-clean streak,
bot-owned platinum-or-better label, three-attempt diamond budget, and platinum
explanation. After its changes, rerun only gates made stale. If those reruns change
head or reviewer-visible proof, re-enter ClawSweeper with preserved `diamond_attempts`
and at most three across the whole workflow. An unchanged rerun does not justify
another bot trigger.

Finish when one state has current review, proof, required CI, repo gates, and
ClawSweeper's `already-diamond-or-better`, `diamond-achieved`, or
`platinum-with-explanation`, with no push after final review. Report PR URL,
exact SHA, bot outcome/label/three-clean evidence, review/proof/CI/repo status,
owner decisions, and any platinum ceiling. Distinguish OpenClaw-gate success
from overall PR readiness; high score never means approved or merged.
