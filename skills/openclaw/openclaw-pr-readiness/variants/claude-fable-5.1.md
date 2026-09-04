---
name: openclaw-pr-readiness
description: 'Prepare or assess openclaw/openclaw PRs for exact-head proof, review, CI, and the scoped ClawSweeper gate. Use when publishing, updating, or preparing an OpenClaw PR for review or merge.'
---

# OpenClaw PR readiness

Bring every authorized readiness gate to the same PR state. Keep the bot's
rating separate from review, proof, CI, maintainer approval, and human sign-off.

1. Verify that the PR base repository is exactly `openclaw/openclaw`. Otherwise
   return `not-applicable` and stop without loading the remaining workflow.
2. Establish the caller's publication authority. This skill grants none itself.
   Authorized pushes/PR updates allow the exact machine comment required by
   `clawsweeper-until-clean`, not prose comments, manual rating labels, reactions,
   merge/automerge, deployment, or unrelated cleanup.
3. Prepare a focused patch. Resolve actionable correctness/security findings
   with repo-owned behavior and focused regression proof. Distinguish pinned
   merge-base-to-head PR changes from base drift; do not call an endpoint
   comparison the PR diff. Use normal non-force base alignment and exact-head
   checks. Put product/compatibility decisions to the owner instead of widening
   scope for a better score. Verify unfamiliar current behavior from source.
4. Load `pr-proof-pack` and refresh stale proof for the current head. Show direct
   observed behavior at the changed boundary. Keep text copyable; use screenshots
   or recordings only for visual/interactive claims and linked artifacts only
   for real inspectable evidence. Runtime/auth/network/security/lifecycle claims
   need diagnostics, traces, logs, or live output. Tests, mocks, and CI are supporting proof.
5. Load `clawsweeper-until-clean`. Let it own the exact comment, three-clean
   streak, bot-owned platinum-or-better label, three diamond attempts, and the
   explanation if platinum remains. Do not reimplement that rating workflow.
6. After it returns, rerun gates its fixes/rank-up changes made stale. Batch
   independent gate checks. If head or judged reviewer-visible proof changes,
   resume ClawSweeper with `diamond_attempts` preserved, never exceeding three
   across the workflow. Do not retrigger the bot for unchanged state.
7. Stop when one PR state simultaneously has current exact-head `code-review`,
   proof, required CI, repo gates, and a terminal successful ClawSweeper outcome
   (`already-diamond-or-better`, `diamond-achieved`, or `platinum-with-explanation`).
   No push may follow the final counted review.

Report URL, exact head, bot outcome and label, final three-clean evidence,
review/proof/CI/repo gates, and owner blockers. Include the platinum explanation.
Say "OpenClaw gate passed" separately from "PR is ready" when other gates block.
A high score is not approval or merge. During long work, report new gate results,
evidence changes, or blockers.
