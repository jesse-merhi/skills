---
name: openclaw-pr-readiness
description: 'Prepare or assess openclaw/openclaw PRs for ClawSweeper, establish a clean platinum-or-better baseline, then make one bounded attempt at diamond when current in-scope evidence can justify it. Use when publishing, updating, or preparing an OpenClaw PR for review or merge.'
---

# OpenClaw PR readiness

Make an `openclaw/openclaw` PR genuinely easy to merge. First converge on a
clean, platinum-or-better ClawSweeper baseline. Only then inspect the completed
review for a small, honest way to reach diamond. Platinum is a successful
result. Diamond is a one-attempt stretch goal, and challenger is welcome when
the evidence naturally earns it; neither is a second merge gate.

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

## Establish the clean baseline

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

The baseline is complete only when one unchanged head has three consecutive
clean reviews and a ClawSweeper-owned platinum, diamond, or challenger label.
Do not start diamond work before this baseline exists.

## Try for diamond after clean

Read [rating-rubric.md](references/rating-rubric.md). Check the current
ClawSweeper source if its main-branch SHA has moved beyond the pinned revision;
the running bot and its current source outrank that snapshot.

Inspect the newest completed ClawSweeper review from the clean baseline and
record its overall rating, proof and patch tiers, `Rank-up moves`, requested
live validation, remaining uncertainty, and exact PR head. Then choose one
outcome:

- **Already diamond or better:** keep the clean baseline and finish.
- **One diamond attempt:** when the result is platinum and an author-controlled
  improvement is safe, in scope, and likely to remove real uncertainty, apply
  it once. Examples include completing missing exact-head validation, capturing
  direct behavior proof, resolving a P3 finding, or recording an already-made
  compatibility decision.
- **Platinum with a ceiling:** when the remaining move needs a maintainer or
  product decision, an unavailable environment, meaningful scope expansion, or
  evidence the author cannot honestly obtain, preserve platinum and record the
  concrete reason diamond was not attempted.

Any patch, proof, or PR update made for the diamond attempt makes the earlier
ClawSweeper streak stale. Re-run every gate that the update invalidated, then
load `clawsweeper-until-clean` again and establish a new clean
platinum-or-better result. This is the final diamond attempt. If the new result
is still platinum, stop and report the specific confidence gap or decision in
the newest ClawSweeper review that kept it from diamond.

Do not add decorative media, invent a benchmark, weaken a test, suppress a
finding, broaden the implementation solely for a badge, or run another rank-up
cycle. Do not delay an otherwise ready platinum PR merely to chase diamond or
challenger.

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
rank-up move applied or declined, the final three-clean evidence, and one of
`already-diamond-or-better`, `diamond-achieved`, or
`platinum-with-explanation`. For the last outcome, state exactly why diamond
was not reached and whether the limit was evidence, environment, scope,
residual risk, or an owner decision. Distinguish "OpenClaw gate passed" from
"PR is ready," and never describe a merely high-scoring PR as merged or
approved.
