# Post-clean rank-up

Run this decision only after three consecutive clean ClawSweeper reviews and a
bot-owned platinum-or-better label exist on one unchanged head.

## Read the awarded result

Read [rating-rubric.md](rating-rubric.md). Check the current ClawSweeper source
if its main-branch SHA has moved beyond the pinned revision; the running bot and
its current source outrank that snapshot.

From the newest completed review in the clean streak, record:

- the awarded label and exact head SHA;
- proof and patch tiers;
- `Rank-up moves` and requested live validation;
- remaining uncertainty, findings, and owner decisions.

If the label is diamond or challenger, return `already-diamond-or-better` when
`diamond_attempts` is zero and `diamond-achieved` otherwise. Do not change the
PR.

## Make at most three attempts

For platinum, make another rank-up attempt only when `diamond_attempts < 3` and
the newest review identifies a distinct improvement that is author-controlled,
safe, in scope, and likely to remove real uncertainty.
Examples include completing missing exact-head validation, capturing direct
behavior proof, resolving a P3 finding, or recording a compatibility decision
that an owner has already made.

Increment `diamond_attempts` before changing code, proof, or PR state. Apply one
distinct improvement through the repository's normal implementation or proof
workflow. Any such change makes the earlier ClawSweeper streak stale; reset the
clean counter and establish a new three-clean platinum-or-better result. Then
inspect that fresh review before choosing another move. A code change or push
can also invalidate code review, proof, CI, and repository gates, which the
calling workflow must rerun.

Do not add decorative media, invent a benchmark, weaken a test, suppress a
finding, or broaden the implementation solely for a badge.

## Explain the ceiling

Return `platinum-with-explanation` without attempting a change when the only
remaining rank-up move requires a new maintainer or product decision, an
unavailable environment, meaningful scope expansion, evidence the author
cannot honestly obtain, no new concrete author-controlled improvement, or all
three attempts have been spent.

When the newest final review still awards platinum, either use the next
distinct move while budget remains or return `platinum-with-explanation` and
quote or precisely paraphrase the remaining confidence gap or decision.
Do not start a fourth rank-up cycle.
