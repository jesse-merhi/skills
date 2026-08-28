# ClawSweeper rating rubric

This is a source-derived snapshot, not a folklore checklist. It was verified
against `openclaw/clawsweeper` commit
`2129a78a502e4e6ed3dd0c521db5034743f1757a` on 2026-08-28.

Before relying on exact thresholds, compare that SHA with current `main` and
read the current rating code if it moved:

```sh
gh api repos/openclaw/clawsweeper/commits/main --jq .sha
```

Primary sources:

- [rating derivation](https://github.com/openclaw/clawsweeper/blob/2129a78a502e4e6ed3dd0c521db5034743f1757a/src/clawsweeper-rating.ts)
- [proof and review policy](https://github.com/openclaw/clawsweeper/blob/2129a78a502e4e6ed3dd0c521db5034743f1757a/src/clawsweeper-policy.ts)
- [review prompt](https://github.com/openclaw/clawsweeper/blob/2129a78a502e4e6ed3dd0c521db5034743f1757a/prompts/review-item.md)
- [PR review presentation](https://github.com/openclaw/clawsweeper/blob/2129a78a502e4e6ed3dd0c521db5034743f1757a/src/clawsweeper-review-presentation.ts)

## Overall rating

ClawSweeper derives the overall tier as the weaker of proof confidence and
patch quality. When one side is not applicable, the other side determines the
result.

| Tier | Label | Meaning |
| --- | --- | --- |
| S, 6/6 | `rating: 🦀 challenger crab` | exceptional |
| A, 5/6 | `rating: 🦞 diamond lobster` | very strong |
| B, 4/6 | `rating: 🐚 platinum hermit` | strong |
| C, 3/6 | `rating: 🦐 gold shrimp` | solid but not ready enough for this gate |
| D, 2/6 | `rating: 🦪 silver shellfish` | needs work |
| F, 1/6 | `rating: 🧂 unranked krab` | not ready |
| NA | `rating: 🌊 off-meta tidepool` | rating side not applicable |

## Proof tier

For a proof gate that applies:

- sufficient recording, screenshot, or linked artifact: S;
- sufficient terminal output, live output, logs, or another proof kind: A;
- an accepted override: A;
- insufficient or mock-only proof: D;
- missing proof: F;
- a gate that does not apply: NA.

ClawSweeper's prompt treats maintainer or bot PRs as candidates for NA proof.
In observed reviews of `jesse-merhi` OpenClaw PRs, repository-member authorship
was explicitly treated as exempt from the external-contributor proof gate.
When proof is NA, additional media can improve human confidence but does not
automatically raise the derived score; patch quality controls the overall tier.

Evidence must match the claim. A screenshot is appropriate for static visible
state. An interactive transition may need a recording. Runtime, CSP, CORS,
authentication, network, security, or lifecycle behavior needs diagnostics,
traces, logs, live output, or an inspectable artifact. Tests, mocks, and CI are
supplemental rather than direct real-behavior proof.

## Patch tier

For a correct patch with no security concern and no findings, the reported
review confidence determines the tier:

- confidence at least 0.95: S / challenger;
- confidence at least 0.80: A / diamond;
- confidence at least 0.60: B / platinum;
- lower confidence: C / gold.

Findings cap the tier even when the patch is otherwise correct:

- any P0 or P1 finding: at most D;
- any P2 finding: at most C;
- any P3 finding: at most B.

When the patch is judged incorrect, P0/P1 produces F, P2 produces D, and a
lower-severity finding produces C. A security result of `needs_attention`
produces F.

The confidence score is a review judgment, not a field the author supplies.
Raise it legitimately by reducing uncertainty: a focused coherent diff,
current base, exact-head checks, direct behavior proof, resolved findings, and
no hidden compatibility or product decision. Never claim or tune a confidence
number yourself.

The current review prompt also distinguishes introduction evidence from base
drift. Establish PR ownership from the pinned merge-base-to-head delta. A
base-to-head endpoint comparison can include base-branch changes and must not be
presented as work introduced by the PR. Clear provenance prevents false risks
and makes a high-confidence review easier to justify.

## Why platinum happens

Recent merged and open `jesse-merhi` PRs showed the recurring pattern:

- proof was usually NA because the author was a repository member;
- patch quality was platinum even with zero findings when an explicit
  compatibility or owner decision remained;
- incomplete current-base or live validation was called out as the next
  confidence booster;
- diamond PRs paired clean focused patches with direct exact-head behavior
  evidence and fewer unresolved decisions.

Use diamond as a stretch goal after ClawSweeper has established a clean
platinum-or-better baseline, not as a second merge gate. Inspect the baseline
review's rank-up moves and make at most three distinct author-controlled
attempts to remove uncertainty that is already within scope. Re-establish every
invalidated gate after each attempt and use the fresh review to choose the next
move. Stop early when no safe, concrete move remains. If the remaining move
needs a maintainer decision, a new environment, or broader work, preserve the
honest platinum result and report that concrete ceiling instead of delaying the
PR.

Challenger is not a separate secret checklist. Under the pinned source, it
requires the weaker applicable side to reach S. For a member PR with proof NA,
that means a clean, correct, security-clear patch reviewed at at least 0.95
confidence. Do not turn that threshold into pressure to hide uncertainty; an
honest platinum with a named owner decision is better than a misleading higher
badge.
