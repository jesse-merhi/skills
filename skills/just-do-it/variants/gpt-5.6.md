---
name: just-do-it
description: 'Take one well-defined, cohesive change from its current implementation or delivery checkpoint through exact-head code review, proof, CI, and a reviewer-ready PR. Use only when the user explicitly invokes this skill.'
---

# Just Do It

On explicit invocation only, take one small, well-defined cohesive change from
its verified checkpoint to a non-draft PR ready for Jesse to inspect. Resume
correct work instead of restarting it and make ordinary in-scope decisions directly.

This invocation authorizes a feature branch, local commits, normal feature-branch
pushes, one PR's creation/update/title/body, required proof uploads, draft/ready
changes, and full `code-review`. It does not authorize force-push, merge, deployment,
manual labels/reactions/prose comments, destructive operations, new dependencies,
breaking changes, or unrelated scope. Ask when a missing product decision,
security disclosure, production mutation, breaking change, dependency, or multi-PR
shape changes the assignment. Repo gates remain authoritative without expanding scope.

## Resume from evidence

Inspect worktree, branch/base/net diff/commits, PR metadata/authorship/remote head,
review closeout, proof, required CI, and repo gates. Classify each checkpoint
current/incomplete/stale/not applicable and start at the earliest unfinished one.
Chat claims, task status, and old passing checks count only when tied to the
current tree/head. Preserve correct implementation, existing PR, and current
review/proof. A ready PR stays ready only while all required evidence remains
current; return it to draft when new work invalidates later checkpoints.

## Carry the change through delivery

1. Read applicable instructions, code, and installed dependencies. Reproduce the
   problem or record an observable baseline if work remains; otherwise verify
   the existing diff against acceptance. Use a dedicated worktree, non-default
   feature branch, current intended base, and one-PR shape. Before any GitHub
   mutation verify active account `jesse-merhi` and Jesse authorship of an existing
   PR. Preserve unrelated edits. Establish before/after behavior, scope, validation,
   branch/base, and later checkpoint status.
2. Reuse repo utilities/dependencies/components and make the smallest complete
   repair. Add/update narrow practical contract proof. If already implemented,
   exercise and retain it. Run sufficient local checks, stopping at the first
   test error to diagnose. Completion is working behavior and focused validation
   without unrelated cleanup or speculation.
3. Audit and commit only the intended net diff with readable subjects. If a new
   head invalidates readiness, return the PR to draft before pushing. Push normally
   to the feature branch and create one draft PR or update the verified existing
   Jesse-authored PR. A new draft needs truthful problem/fix context. Never push
   default or take over unverifiable authorship/destination. Confirm branch/base
   and local/remote head match with no unrelated published changes.
4. If no current exact-head full closeout exists, load `code-review` and complete/
   resume both until-clean phases, fixes, validation, closeout, and authorized
   final push. This invocation is the review decision; do not ask again or substitute
   ad hoc review, CI, proof, repo bots, or `autoreview`. Require clean exact-tree
   review with all fixes in the remote head and persisted evidence.
5. Load `pr-proof-pack` for final direct-base proof. Refresh only stale/missing
   evidence, show matched reproducible broken/fixed behavior, choose the simplest
   accurate form, and inspect rendering. Mark draft ready once that proof is
   usable to a cold reader. Preserve current proof.
6. Monitor required CI and repo readiness gates. Changes to code/generated output/
   base/head invalidate affected review/proof/CI/gates. Return to the earliest
   stale checkpoint and proceed again using normal non-force base updates. A
   failed/blocked gate returns the PR to draft before diagnosis/reporting.
7. Verify final metadata/head: non-draft, no merge conflict, exact-head review,
   current proof, passing required CI, and every repo gate. Leave human approval
   and `jesse-merhi`'s required thumbs-up to Jesse. Do not merge, enable automerge,
   label/react, or call a blocked PR ready.

Lead the final report with PR URL/readiness and exact head. Explain changed
behavior, observed before/after proof, full review findings/fixes, CI/repo gates,
and what still needs Jesse. Distinguish ready for review from approved or merged;
if blocked, name the exact external blocker and safest preserved checkpoint.
