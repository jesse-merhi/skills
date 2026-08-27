---
name: openclaw-pr-readiness
description: 'Prepare or assess openclaw/openclaw PRs for ClawSweeper, make one bounded attempt at diamond when current in-scope evidence can justify it, and enforce an exact-head platinum-or-better handoff gate. Use when publishing, updating, or preparing an OpenClaw PR for review or merge.'
---

# OpenClaw PR readiness

Make an `openclaw/openclaw` PR genuinely easy to merge. Improve the patch and
its evidence before asking ClawSweeper to score it, then require a current
platinum-or-better result. Platinum is a successful result. Treat diamond as
the preferred stretch goal when a small amount of honest, in-scope work can
remove real uncertainty. Accept challenger when the evidence naturally earns
it; do not make challenger a workflow target.

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

## Understand the score before changing anything

Read [rating-rubric.md](references/rating-rubric.md) when optimizing or
explaining a rating. Check the current ClawSweeper source if its main-branch SHA
has moved beyond the pinned revision in that reference; the running bot and its
current source outrank this snapshot.

Inspect the newest ClawSweeper review on the current head and record:

- overall readiness, proof confidence, and patch quality;
- every actionable finding and merge blocker;
- `Rank-up moves` and any requested live validation;
- the head SHA, base SHA, check state, and whether the proof describes that
  exact tree.

Do not infer that missing media caused a platinum rating. For member-authored
PRs, ClawSweeper normally marks the external-contributor proof gate not
applicable, so patch confidence determines the overall tier. Common legitimate
platinum caps are incomplete exact-head validation, an unresolved compatibility
or product decision, residual risk, a P3 finding, or review confidence below
the diamond threshold.

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

3. Make one bounded diamond pass.

   Before the final clean loop, inspect ClawSweeper's `Rank-up moves` once.
   Apply author-controlled improvements that are safe, in scope, and materially
   increase confidence: finish exact-head checks, capture missing direct proof,
   remove a P3 finding, or record an already-settled compatibility decision.
   Stop the diamond pass when the remaining improvement requires a new owner
   decision, unavailable environment, meaningful scope expansion, or repeated
   re-reviews without new evidence. Report that ceiling and continue toward the
   platinum gate.

   Do not add decorative media, invent a benchmark, weaken a test, suppress a
   finding, or broaden the implementation solely for a badge. Do not delay an
   otherwise ready platinum PR merely to chase diamond or challenger.

## Run the gate

Load `clawsweeper-until-clean`. Its exact `/clawsweeper re-review` command is
the sole PR comment authorized by this skill. Complete its three-clean streak
on one unchanged head and require one of these ClawSweeper-owned labels:

- `rating: 🐚 platinum hermit`
- `rating: 🦞 diamond lobster`
- `rating: 🦀 challenger crab`

Never add, remove, rename, or preserve a rating label on the bot's behalf. A
push invalidates the clean streak and rating observation even when GitHub still
shows an old label.

If ClawSweeper finds something, make the narrow fix and return to the earliest
invalidated gate. A code change or push normally makes earlier code-review,
proof, CI, and ClawSweeper evidence stale. Re-run forward until one exact head
simultaneously holds all required evidence.

The three-clean loop proves consistency; it is not a rating lottery. Do not
trigger extra reviews after the required streak solely in hope of a higher
label when the patch and evidence have not changed.

## Completion

Call the OpenClaw gate ready only when:

- the base repository is `openclaw/openclaw`;
- three consecutive fresh ClawSweeper reviews are clean on the current head;
- ClawSweeper awarded platinum, diamond, or challenger to that same head;
- no push followed the final review;
- the separate code-review, proof, required CI, and repository gates are also
  current, or the caller explicitly records which of them still blocks overall
  PR readiness.

Report the PR URL, exact head SHA, awarded label, proof and patch tiers, the
rank-up moves applied or declined, the three-clean evidence, and anything that
still needs an owner decision. Distinguish "OpenClaw gate passed" from "PR is
ready," and never describe a merely high-scoring PR as merged or approved.
