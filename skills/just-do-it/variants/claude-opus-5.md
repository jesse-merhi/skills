---
name: just-do-it
description: 'Take one well-defined, cohesive change from its current implementation or delivery checkpoint through exact-head code review, proof, CI, and a reviewer-ready PR. Use only when the user explicitly invokes this skill.'
---

# Just Do It

Deliver one small, well-defined cohesive change as a non-draft PR ready for Jesse
to inspect. Use only on explicit invocation. Preserve valid completed checkpoints
and every mandated review streak; do not add optional review rounds or redo
correct work to demonstrate activity.

The invocation authorizes feature branching, local commits, normal feature-branch
pushes, one PR's creation/update/title/body, required proof uploads, draft/ready
changes, and full `code-review`. It does not authorize force-push, merge,
deployment, manual labels/reactions/prose comments, destructive operations,
new dependencies, breaking changes, or out-of-scope work. Ask when a missing
product decision, security disclosure, production mutation, dependency, breaking
change, or multi-PR shape materially changes the assignment. Apply repo gates
without using them to expand scope.

Inspect worktree, branch/base/net diff/commits, PR metadata/authorship/remote head,
review closeout, proof, CI, and repository gates. Mark checkpoints current,
incomplete, stale, or not applicable. Evidence must match current tree/head;
chat claims and old passes do not suffice. Resume the earliest incomplete/stale
step. Preserve correct implementation, existing PR, and current exact-head review/
proof. A ready PR stays ready only while its evidence remains current; invalidated
readiness goes back to draft.

Complete the remaining checkpoints:

1. Establish before/after acceptance behavior by reproducing or recording the
   baseline, or exercising an already implemented diff. Read repo instructions,
   code, and installed dependencies. Verify dedicated worktree, non-default
   feature branch, current intended base, single-PR shape, and validation scope.
   Before any GitHub write require active `jesse-merhi` and Jesse authorship of
   an existing PR. Preserve unrelated edits.
2. Reuse repo utilities/dependencies/components and implement only the smallest
   complete behavior change with narrow practical contract proof. Keep correct
   existing work. Run sufficient focused checks; stop and diagnose the first
   test error. No unrelated cleanup, speculative code, or test expansion.
3. Audit/commit the scoped net diff with readable subjects. Return ready to draft
   before an invalidating push, then push normally to the feature branch. Create
   one truthful draft or update the verified Jesse-authored PR. Confirm local/
   remote head, branch/base, and scoped content. Never push default or take over
   unverifiable destination/authorship.
4. Run/resume `code-review` if current exact-head full closeout is absent. This
   invocation grants the review decision. Preserve both until-clean phases,
   accepted fixes, final validation, closeout, and authorized final push; do not
   ask again or substitute ad hoc review, CI, proof, repo bots, or `autoreview`.
   Require persisted clean review and accepted fixes in the remote head.
5. Check final direct-base `pr-proof-pack`; refresh stale/missing claims only.
   Show observed reproducible before/after behavior in the simplest accurate
   form, inspect rendering, and mark draft ready with usable cold-reader context.
6. Converge required CI and repo gates on that head. Code/generated/base/head
   changes invalidate affected evidence; return to draft and resume the earliest
   stale checkpoint. Use normal non-force updates. Failed/blocked gates require
   draft state before diagnosis or reporting.
7. Verify non-draft, no conflict, current exact-head review/proof, passing required
   checks, and repo gates. Leave approval and `jesse-merhi`'s thumbs-up to Jesse.
   Do not merge, enable automerge, label/react, or describe blockage as readiness.

Return a concise URL/readiness report with exact head, change, observed proof,
full review findings/fixes, CI/repo status, and what awaits Jesse. Ready for review
is distinct from approved or merged; name an exact external blocker and preserve
the safest completed checkpoint when the workflow cannot finish.
