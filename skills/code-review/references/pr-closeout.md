# PR closeout

Code review is a local fix loop followed by one delivery. Do not mutate a
remote branch, PR, or GitHub Actions run while either review phase has findings.

## Publication authority

Invoking `code-review` grants authority for one normal final push to the
existing PR branch after both review phases and full local validation are clean,
but only when GitHub reports that every affected PR is authored by the account
currently authenticated in `gh`.

Resolve the existing PR and inspect its author before preparing any remote
mutation:

```sh
authenticated_login="$(gh api user --jq .login)"
gh pr view --json number,url,author,headRefName,baseRefName,isCrossRepository
```

- If `author.login` equals `authenticated_login`, the workflow may make its
  final normal push to that existing head branch.
- For a stack, verify every affected PR author before submitting any layer.
- If the author is different, missing, or cannot be verified, keep every fix
  local. Report the clean result, PR author, and local commits or diff, then ask
  the user what to do.
- This workflow grant never authorizes force-push, a new destination branch, a
  different PR, or pushing directly to the default branch. Get explicit
  approval for those changes.

An explicit instruction from the user to push after a fix, publish, ship, or update
the PR remains valid publication authority under `AGENTS.md`. The author check
above still governs `code-review`'s automatic final push.

## Final delivery order

1. Finish locally.

   Confirm Phase 1 passed, Phase 2 is clean on the final tree, and the full
   local validation selected during setup passed. If validation changes code,
   return to the affected review phase. Only after the final tree is stable,
   run the final `scope-check` and record `scope-complete`.

   Done when no review or validation work remains before delivery.

2. Pass the PR-owner gate.

   Resolve the existing PR, confirm its head branch matches the intended local
   branch, and verify the author rule above. Preserve a planned stack with
   `gh-stack`; do not replace it with a standalone PR.

   Done when the exact authorized destination is known, or remote delivery has
   stopped with a local handoff.

3. Check proof freshness before publishing.

   Load `pr-proof-pack`. Complete its read-only net-diff and freshness check.
   If proof is stale, prepare the required behavior capture and browser
   preflight before any remote mutation. If proof is current, record the no-op
   result and do not rewrite it.

   Done when proof is classified as `current`, `stale with prepared evidence`,
   or blocked.

4. Publish once.

   Commit only the reviewed changes, then make one normal push to the verified
   existing PR head. For a stack, use `gh-stack`'s non-interactive submit flow
   after every affected PR passed the owner gate. Do not force-push under the
   workflow's automatic authority.

   Done when the remote PR head matches the reviewed local tree.

5. Finish proof only when stale.

   If the freshness check was stale, finish `pr-proof-pack` against the pushed
   head and inspect the rendered PR. If it was current, leave the PR body and
   evidence untouched.

   Done when reviewer-visible proof accurately describes the pushed net diff
   without a performative rewrite.

6. Run CI last.

   The final push starts GitHub Actions. Monitor required checks only now. If CI
   finds a real defect, diagnose it, repair and validate locally, rerun the
   affected review phase, then repeat the final delivery sequence. Do not patch
   directly from a failing remote log and immediately push again.

   Done when required CI passes, or the exact blocker and residual risk are
   reported.

7. Apply human sign-off.

   First confirm the review closeout names the exact final head. A later
   branch change makes that review stale. If evidence is missing, stale, or
   unverifiable, tell the user and ask whether to rerun `code-review` or explicitly
   waive it for this PR and head; do not start the expensive review
   automatically.

   Once that decision, proof, local validation, and CI pass, summarize the
   review findings, fixes, verification, and anything still open. Resolve the
   expected sign-off login from task or project configuration; if none exists,
   use `authenticated_login`. Ask that person to add a thumbs-up (`+1`)
   reaction to every open PR in a stack, bottom-to-top, and verify each reaction
   belongs to the resolved login.
   Never create or remove that reaction on the user's behalf. The reaction
   gates merge, not authorized branch updates or local repair.

   Done when every PR awaiting merge has an exact-head review or explicit
   waiver and the required human reaction, or the response clearly asks the user
   for either decision.

## Local handoff

When publication is unauthorized or blocked, report the review result
separately from delivery. Include the verified local tree, validation result,
proof freshness result if known, and the exact permission or ownership decision
needed. Do not describe the PR as updated.
