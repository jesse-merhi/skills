---
name: openclaw-pr-readiness
description: 'Prepare or assess openclaw/openclaw PRs for exact-head proof, review, CI, and the scoped ClawSweeper gate. Use when publishing, updating, or preparing an OpenClaw PR for review or merge.'
---

# OpenClaw PR readiness

Bring one verified `openclaw/openclaw` PR to a single current readiness state
without expanding the repository or publication scope below. Open with the PR
and exact head. Update only when review, proof, CI, repository gates,
ClawSweeper, or owner state changes.

Keep reviewer-facing proof concise and matched to the current head. The final
response must report the PR URL, exact head, delegated ClawSweeper result, label,
three-clean evidence, review, proof, CI, gates, and remaining owner action. The
fixed-point reruns below are required only when a gate becomes stale.
`clawsweeper-until-clean` is the one mandated delegated workflow; do not add
other agents.

Make an `openclaw/openclaw` PR genuinely easy to merge. Prepare the strongest
honest review packet, delegate ClawSweeper convergence and rating improvement to
`clawsweeper-until-clean`, and finish only when every required gate describes
the same PR state.

## Scope and authority

First verify the PR's base repository is exactly `openclaw/openclaw`. If it is
not, return `not-applicable` without loading the rest of this workflow. This is
the only repository whose policy this skill encodes.

This skill does not grant publication authority by itself. The calling request
or workflow must already authorize PR updates and pushes. When that authority
exists, it also permits the exact machine-command comment required by
`clawsweeper-until-clean`; it does not permit prose PR comments, manual rating
labels, reactions, merge, automerge, deployment, or unrelated cleanup.

ClawSweeper is an OpenClaw-specific readiness signal, not a substitute for the
exact-head `code-review` workflow, current proof, required CI, maintainer
approval, or Jesse's sign-off reaction.

## Prepare the strongest honest review packet

1. Make the patch boring to trust.

   Keep the diff focused and coherent. Resolve every actionable correctness or
   security finding. Use repository-owned behavior and focused regression tests.
   Make ownership unambiguous: distinguish the pinned merge-base-to-head changes
   introduced by this PR from drift on the base branch, and do not claim an
   endpoint comparison as the PR diff.
   Bring the branch to the expected base through the repository's normal
   non-force flow, and finish the relevant exact-head checks. If a product or
   compatibility decision belongs to an owner, state it plainly instead of
   hiding it or expanding the PR to chase a higher score.

2. Prove the changed behavior, not just the test harness.

   Load `pr-proof-pack` and refresh stale proof against the current head. Prefer
   direct observed behavior at the changed boundary. Keep textual behavior as
   copyable text. Use a screenshot or recording only when the claim is
   genuinely visual or interactive, and use a linked artifact only when it
   contains real inspectable evidence. For browser-runtime, auth, network,
   security, or lifecycle claims, include the relevant diagnostics, trace,
   logs, or live output; a clean-looking screenshot cannot prove those claims.
   Tests, mocks, and CI support real-behavior proof but do not replace it.

## Run the scoped ClawSweeper gate

Load `clawsweeper-until-clean`. It owns the exact machine-command comment, the
three-clean streak, the bot-owned platinum-or-better label, the three-attempt
diamond budget, and the concrete explanation when platinum remains.
Do not duplicate or reinterpret that rating workflow here.

ClawSweeper fixes or rank-up work can make earlier code review, proof, CI, and
repository evidence stale. After `clawsweeper-until-clean` returns, rerun every
gate its changes invalidated. If that work changes the head or reviewer-visible
proof that ClawSweeper judged, re-enter `clawsweeper-until-clean` with its
`diamond_attempts` state preserved. The resumed run may reconverge and spend
remaining attempts but may never exceed three across the complete workflow.

Repeat only until one PR state simultaneously holds current code review, proof,
required CI, repository gates, and the final ClawSweeper result. An unchanged
rerun is not a reason to trigger the bot again.

## Completion

Call the OpenClaw gate ready only when:

- the base repository is `openclaw/openclaw`;
- `clawsweeper-until-clean` returned `already-diamond-or-better`,
  `diamond-achieved`, or `platinum-with-explanation` for the current PR state;
- no push followed the final review;
- the separate code-review, proof, required CI, and repository gates are also
  current, or the caller explicitly records which of them still blocks overall
  PR readiness.

Report the PR URL, exact head SHA, delegated ClawSweeper outcome, awarded label,
final three-clean evidence, review, proof, CI, repository gates, and anything
still waiting on an owner. Include the ClawSweeper explanation when the result
is platinum. Distinguish "OpenClaw gate passed" from "PR is ready," and never
describe a merely high-scoring PR as merged or approved.
