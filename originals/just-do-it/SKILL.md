---
name: just-do-it
description: 'Take one well-defined, cohesive change from its current implementation or delivery checkpoint through exact-head code review, proof, CI, and a reviewer-ready PR. Use only when the user explicitly invokes this skill.'
---

# Just Do It

Take a small, well-defined change from whatever verified checkpoint it has
reached to a non-draft PR that is ready for Jesse to inspect. Continue correct
existing work instead of restarting it. Keep moving through ordinary
implementation and delivery decisions without asking for intermediate approval.

Invoking this skill grants bounded authority to create a feature branch, make
local commits, make normal pushes to that branch, create or update one PR, edit
its title and body, upload required proof, change its draft/ready state, and run the full
`code-review` workflow. It does not authorize force-push, merge, deployment,
manual labels, PR reactions, prose comments, destructive operations, new
dependencies, breaking changes, or work outside the requested change.

## Fit check

Use this workflow only when the requested outcome and acceptance behavior are
already clear and the work belongs in one cohesive PR. Stop and ask before
continuing when a missing product decision, breaking change, new
dependency, security disclosure, production mutation, or multi-PR delivery
shape would materially change the assignment. Do not squeeze larger work into
this workflow merely because the skill was invoked.

Repository instructions remain authoritative. Apply their project-specific
validation and delivery gates without copying those rules into this generic
skill. A repository gate may make the PR harder to finish, but it does not
expand the requested implementation scope.

## Resume rule

Treat this workflow as a resumable checkpoint chain, not a mandatory restart.
Inspect the local and remote evidence before acting: worktree, branch, base,
net diff, commits, PR metadata and authorship, remote head, review closeout,
proof, required checks, and repository-specific gates. Classify each workflow
step as current, incomplete, stale, or not applicable. A chat claim, task
status, or old passing result is not evidence unless it still matches the
current tree or exact remote head.

Resume at the earliest incomplete or stale step. Preserve every current
checkpoint: do not reimplement an already-correct scoped change, open a
duplicate PR, or rerun current exact-head review or proof. Keep an existing
ready PR ready only while all exact-head readiness evidence remains current.
When new work invalidates later evidence, return the PR to draft, resume at the
earliest invalidated step, and continue forward. This invocation grants the
same bounded authority regardless of where the workflow resumes.

## Workflow

1. Discover the current checkpoint and freeze the delivery target.

   Read the applicable instructions, inspect the relevant code and installed
   dependencies, and recover the existing implementation and delivery state.
   Reproduce the problem or record the observable baseline when implementation
   is still needed; otherwise verify the existing diff against the acceptance
   behavior. Confirm the worktree is dedicated, the feature branch is not the
   default branch, the intended base is current, and one PR is the right
   delivery shape. Before any GitHub mutation, verify the active account is
   `jesse-merhi` and any existing PR is Jesse-authored. Preserve unrelated local
   changes.

   Done when the before behavior, expected after behavior, scope boundary,
   validation targets, branch, base, single-PR shape, and current/stale status
   of every later checkpoint are concrete.

2. Complete or verify the smallest complete fix.

   Reuse repository utilities, dependencies, and shared components before
   adding custom behavior. Add or update the narrow test that proves the bug or
   contract when that is practical. If the requested behavior is already
   implemented, inspect the net diff, exercise it directly, and keep it without
   rewriting it. Run the smallest sufficient local validation. Stop on the
   first test failure and diagnose it before continuing.

   Done when the requested behavior works in practice, focused validation
   passes, and the diff contains no unrelated cleanup or speculative work.

3. Create or update the reviewable PR when needed.

   Audit the net diff and commit only the requested change with a readable
   subject. Before pushing a new head, return an existing ready PR to draft when
   review or proof will become stale. Then make a normal push to the feature
   branch. Create one draft PR when none exists, or update the existing
   Jesse-authored PR for that branch. Preserve its ready state only while every later
   exact-head checkpoint remains current. Give a new draft a truthful title and
   enough initial problem/fix context for review. Never push to the default
   branch or take over a PR whose destination or authorship cannot be verified.

   Done when the PR points at the intended branch and base, its remote
   head matches the local commit, and no unrelated work was published with it.

4. Run or resume the full code review automatically.

   Load `code-review` when no current exact-head closeout proves the full review
   is complete. Complete or resume both of its until-clean phases, accepted
   fixes, final validation, exact-head closeout, and authorized final push. This
   explicit `just-do-it` invocation is the user's review decision: do not pause
   to ask whether to run `code-review`, and do not replace it with an ad hoc
   review, CI, a proof pack, a repository bot, or `autoreview`.

   Done when `code-review` is clean on the exact PR tree, every accepted fix is
   included in the remote head, and its persisted closeout can identify that
   reviewed tree without relying on chat history.

5. Build or refresh the final proof pack.

   Load `pr-proof-pack` against the final direct-base net diff. Refresh the PR
   only when its proof is stale or missing; otherwise preserve the current proof.
   Show the observed broken and fixed behavior for a reproducible bug,
   use the simplest evidence format that preserves the claim, and inspect the
   rendered result. Then mark the PR ready for review if it is still a draft.

   Done when the non-draft PR explains what broke and how it was fixed, its
   reviewer-visible proof matches the current head, and the rendered evidence is usable
   by someone who never saw the implementation thread.

6. Converge remote and repository gates.

   Monitor required CI and apply every repository-specific readiness gate from
   the applicable instructions. Treat these as an exact-head fixed point: any
   code change, generated change, base update, or push makes earlier review,
   proof, CI, and repository-gate evidence stale where applicable. Return to
   the earliest invalidated step and run forward again. Use the repository's
   normal non-force update flow if the branch must be brought up to date. If a
   gate fails or blocks, return the PR to draft before diagnosing or reporting
   the blocker.

   Done when the non-draft PR's current head simultaneously has exact-head
   code-review evidence, current proof, passing required checks, and every
   applicable repository-specific gate.

7. Verify the handoff state.

   Inspect the final PR metadata and current head. Require a non-draft PR, no
   merge conflict, a current review closeout, current proof, passing required
   checks, and all repository-specific gates. Leave human approval and the
   required `jesse-merhi` thumbs-up reaction to Jesse. Do not merge, enable
   automerge, add labels, create reactions, or describe a blocked PR as ready.

   Done when the PR is genuinely ready for Jesse's review or the final report
   names the exact external blocker and preserves the safest completed state.

## Final report

Lead with the PR URL and whether it is ready. Include the exact final head,
what changed in plain language, the observed before/after proof, the full
`code-review` outcome and fixes, required CI, repository-specific gate results,
and anything still waiting on Jesse. Distinguish a ready-for-review PR from a
merged or maintainer-approved PR.
