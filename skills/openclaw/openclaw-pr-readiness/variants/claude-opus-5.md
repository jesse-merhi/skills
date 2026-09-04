---
name: openclaw-pr-readiness
description: 'Prepare or assess openclaw/openclaw PRs for exact-head proof, review, CI, and the scoped ClawSweeper gate. Use when publishing, updating, or preparing an OpenClaw PR for review or merge.'
---

# OpenClaw PR readiness

Deliver an honest readiness packet whose review, proof, CI, repository gates,
and ClawSweeper outcome refer to one PR state. First verify the exact base repo
`openclaw/openclaw`; otherwise return `not-applicable` without loading the workflow.

The caller must authorize publication. This skill does not grant it. Existing
push/PR-update authority permits only the required `clawsweeper-until-clean`
machine comment, not prose comments, manual labels, reactions, merge/automerge,
deployment, or unrelated cleanup. ClawSweeper never replaces exact-head
`code-review`, proof, required CI, repo policy, maintainer approval, or Jesse's sign-off.

Prepare a focused patch with actionable correctness/security issues resolved
through repo-owned behavior and focused regression proof. Distinguish the pinned
merge-base-to-head PR diff from base drift and endpoint comparisons. Use normal
non-force base alignment and exact-head checks. Present owner decisions instead
of adding scope to seek a higher score.

Use `pr-proof-pack` for stale proof. Prefer observed boundary behavior and copyable
text. Use screenshots/recordings for genuinely visual/interactive claims and
linked artifacts only for inspectable evidence. Runtime/auth/network/security/
lifecycle claims require diagnostics, traces, logs, or live output, not clean-
looking screenshots. Tests/mocks/CI are supporting evidence.

Delegate the rating procedure to `clawsweeper-until-clean`: exact comment,
three-clean streak, bot-owned platinum-or-better label, bounded three diamond
attempts, and platinum explanation. Preserve every mandatory streak without
adding optional review rounds or workers. Reuse checkpoints while evidence stays
current. Rerun gates invalidated by bot fixes/rank-up; if that changes head or
judged proof, resume ClawSweeper with its existing `diamond_attempts`, at most
three for the complete workflow. Unchanged reruns do not justify new bot triggers.

The OpenClaw gate passes on a current successful bot outcome
(`already-diamond-or-better`, `diamond-achieved`, or `platinum-with-explanation`)
with no later push. Overall readiness also needs the separate current gates.
Report URL, exact SHA, outcome, label, three-clean evidence, review/proof/CI/repo
status, and owner blockers compactly; include the concrete platinum ceiling.
Never equate a high score with approval or merge.
