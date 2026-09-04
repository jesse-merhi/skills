---
name: just-do-it
description: 'Take one well-defined, cohesive change from its current implementation or delivery checkpoint through exact-head code review, proof, CI, and a reviewer-ready PR. Use only when the user explicitly invokes this skill.'
---

# Just Do It

On explicit invocation, continue one small, well-defined cohesive change to a
non-draft PR ready for Jesse. Use the verified checkpoint and existing grant to
make ordinary implementation/delivery decisions without repeat approval questions.

## Know the bounded grant

This workflow authorizes a feature branch, local commits, normal feature-branch
pushes, one PR's creation/update/title/body, proof uploads, draft/ready transitions,
and full `code-review`. It does not permit force-push, merge, deployment, labels,
reactions, prose comments, destructive actions, new dependencies, breaking changes,
or unrelated scope. Missing product decisions, security disclosure, production
mutation, breaking changes, dependencies, or multi-PR delivery need a user decision
when material. Repo validation/delivery gates apply but do not enlarge scope.

## Resume the first unfinished checkpoint

Inspect worktree/branch/base/net diff/commits, PR metadata/authorship/remote head,
review closeout, proof, CI, and repo gates. Classify current/incomplete/stale/not
applicable from evidence tied to the current tree/head, not chat or task status.
Preserve correct implementation, existing PR, and current review/proof. If a new
change invalidates readiness, return the PR to draft and resume from that earliest
stale checkpoint; a current ready PR need not be recreated or reset.

## Complete implementation and delivery under that authority

Read instructions, code, and installed dependencies. Reproduce/record baseline
if implementation remains, or verify existing acceptance behavior. Confirm the
dedicated worktree, non-default feature branch, current intended base, one-PR
shape, validation targets, and before/after scope. Before GitHub writes verify
`jesse-merhi` is active and any existing PR is Jesse-authored. Preserve unrelated edits.

Reuse repo utilities/dependencies/components for a smallest complete fix and
narrow practical contract proof. If it is already correct, exercise and keep it.
Run sufficient local validation; the first test error requires diagnosis before
continuing. Do not pad the diff with cleanup or speculative work.

Audit and commit scoped changes with readable subjects. Return a ready PR to
draft before pushing a head that invalidates review/proof. Push normally to the
feature branch and create one truthful draft or update its verified Jesse-authored
PR. Confirm remote/local head and branch/base; default-branch push and unverified
authorship/destination are outside the grant.

When exact-head full review is missing/stale, load `code-review` and complete/
resume both until-clean phases, accepted fixes, final validation, closeout, and
final authorized push. Do not ask whether to run it: this invocation is the
review decision. Do not substitute CI, proof, ad hoc reviewers, repo bots, or
`autoreview`. Require persisted clean exact-tree evidence and remote inclusion
of accepted fixes.

Use `pr-proof-pack` for final direct-base proof, refreshing only stale/missing
claims and inspecting practical broken/fixed evidence where reproducible. Mark
ready when proof and context work for a cold reader. Monitor required CI/repo
gates; code/generated/base/head changes invalidate only affected evidence and
restart the earliest stale checkpoint. Failed/blocked gates return to draft
before diagnosis/reporting. Use normal non-force base alignment.

## Verify the actual handoff

Require final non-draft/no-conflict metadata, exact-head review, current proof,
passing required CI, and repo gates simultaneously. Do not add discretionary
checks after completion, but do not waive a required gate for brevity. Jesse owns
approval and the required `jesse-merhi` thumbs-up; never merge, enable automerge,
label/react, or call a blocked PR ready.

Report URL/readiness, exact head, changed behavior, observed before/after proof,
full review findings/fixes, CI/repo status, and owner needs. Distinguish reviewer-
ready from approved/merged and name an exact blocker when stopping.
