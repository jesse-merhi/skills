---
name: openclaw-pr-readiness
description: 'Prepare or assess openclaw/openclaw PRs for exact-head proof, review, CI, and the scoped ClawSweeper gate. Use when publishing, updating, or preparing an OpenClaw PR for review or merge.'
---

# OpenClaw PR readiness

Resolve applicability and authority, then carry the authorized readiness work
through one consistent PR state. The base repository must be exactly
`openclaw/openclaw`; otherwise return `not-applicable` before loading the rest.

## Keep the authority and evidence owners distinct

Publication must come from the caller, not this skill. Existing PR-update/push
authority also permits the exact `clawsweeper-until-clean` machine comment, but
not prose comments, manual labels, reactions, merge/automerge, deployment, or
unrelated cleanup. Named workflows do not create blanket subagent authority.
ClawSweeper is supplementary to exact-head `code-review`, proof, required CI,
repo gates, maintainer approval, and Jesse's sign-off.

## Prepare the current review packet

Keep the diff focused. Resolve actionable correctness/security findings with
repo-owned behavior and focused regression proof. Pin merge-base-to-head PR
ownership separately from base drift; an endpoint comparison is not the PR diff.
Align to the expected base through normal non-force flow and complete exact-head
checks. Keep genuine product/compatibility choices with the owner rather than
expanding scope for a rating.

Use `pr-proof-pack` for stale current-head proof. Show observed boundary behavior;
text stays copyable, visual/interactive claims use actual screenshots/recordings,
and linked artifacts contain inspectable evidence. Runtime/auth/network/security/
lifecycle claims need diagnostics, traces, logs, or live output. Tests/mocks/CI
support the behavior evidence and do not replace it.

## Converge only the gates invalidated by change

Load `clawsweeper-until-clean` for its comment, three-clean streak, bot-owned
platinum-or-better label, three-attempt diamond budget, and platinum explanation.
Do not duplicate its rules. Recheck review/proof/CI/repo gates made stale by its
changes. If those checks change head or reviewer-visible proof, resume the bot
workflow with preserved `diamond_attempts`, never more than three total. Do not
retrigger merely because an unchanged check ran again.

Complete when the same PR state has current review, proof, CI, repo gates, and
bot success (`already-diamond-or-better`, `diamond-achieved`, or
`platinum-with-explanation`), with no push after final review. Report URL, exact
SHA, bot outcome/label/three-clean evidence, other gates, owner blockers, and
platinum ceiling. OpenClaw-gate success is not overall readiness if another gate
blocks, and neither score nor gate success means approved or merged.
