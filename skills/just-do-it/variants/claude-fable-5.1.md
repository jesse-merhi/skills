---
name: just-do-it
description: 'Take one well-defined, cohesive change from its current implementation or delivery checkpoint through exact-head code review, proof, CI, and a reviewer-ready PR. Use only when the user explicitly invokes this skill.'
---

# Just Do It

Use only when explicitly invoked. Finish one small, settled, cohesive change as
a non-draft PR ready for Jesse's inspection. Continue verified work from its
current checkpoint instead of rebuilding it.

The invocation grants feature branching, local commits, normal feature-branch
pushes, one PR's creation/update/title/body, proof uploads, draft/ready state,
and full `code-review`. It excludes force-push, merge, deployment, manual labels,
reactions, prose comments, destructive actions, new dependencies, breaking changes,
and unrelated scope. Stop for a material missing product choice, dependency,
breaking change, security disclosure, production mutation, or multi-PR shape.
Follow repo gates without expanding the assignment.

1. Inspect local and remote worktree/branch/base/net diff/commits, PR metadata/
   authorship/head, review closeout, proof, CI, and repo gates. Batch independent
   reads and verify unfamiliar current behavior from source. Mark each step
   current, incomplete, stale, or not applicable. Resume the earliest incomplete/
   stale step; retain current implementation, PR, review, and proof. Chat/task
   status or an old pass is insufficient without current tree/head evidence.
2. Read repo instructions, relevant code, and installed dependencies. Reproduce
   the problem or baseline when implementation remains; otherwise exercise the
   existing acceptance behavior. Confirm dedicated worktree, non-default feature
   branch, current intended base, and one PR. Before GitHub mutation verify
   active account `jesse-merhi` and Jesse authorship of any existing PR. Preserve
   unrelated changes. Finish this step with concrete before/after, scope,
   validation, branch/base, and downstream checkpoint status.
3. Reuse repo utilities/dependencies/components for the smallest complete fix.
   Add or update narrow practical contract proof. Do not rewrite an already
   correct diff; exercise it. Run sufficient focused validation and stop at the
   first test error to diagnose. Keep all edits/tests inside the requested behavior.
4. Audit and commit the intended net diff with a readable subject. Before a new
   push invalidates review/proof, return an existing ready PR to draft. Push normally
   to the feature branch, creating one truthful draft PR or updating the verified
   Jesse-authored one. Keep ready only while all later evidence is current.
   Confirm local/remote head, branch, and base match; never push default or take
   over unverified authorship/destination.
5. Load `code-review` only when no current exact-head full closeout exists.
   Complete/resume both until-clean phases, accepted fixes, final validation,
   closeout, and authorized final push. This invocation already decides to run
   the review. Do not ask again or replace it with ad hoc review, CI, a proof
   pack, repo bots, or `autoreview`. Require exact-tree clean evidence and all
   accepted fixes in the remote head.
6. Load `pr-proof-pack` on the final direct-base diff. Preserve current proof;
   refresh stale/missing claims, show reproducible broken/fixed behavior in the
   simplest accurate format, and inspect the rendered result. Mark a draft ready
   when its context/proof is usable to a reader without this thread.
7. Monitor required CI and all repo gates. Treat readiness as one exact-head
   fixed point. New code/generated output/base changes/pushes invalidate affected
   evidence; return the PR to draft and resume the earliest stale step. Use
   normal non-force base updates. A failed or blocked gate goes back to draft
   before diagnosis/reporting.
8. Inspect final metadata/head. Require non-draft, no conflict, exact-head review,
   current proof, passing required CI, and repo gates. Leave approval and the
   required `jesse-merhi` thumbs-up to Jesse. Do not merge, enable automerge,
   label, react, or report a blocked PR as ready.

Report meaningful checkpoints, new evidence, or blockers during long work.
Finish with PR URL/readiness, exact head, plain-language change, observed proof,
full review findings/fixes, CI/repo results, and anything awaiting Jesse. A
ready-for-review PR is not merged or maintainer-approved; blockers need exact
next action and the safest completed state.
