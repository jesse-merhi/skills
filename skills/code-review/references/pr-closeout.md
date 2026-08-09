# PR Closeout

When creating, updating, or preparing a PR, include proof that the behavior
works in the PR description, PR comment, or closeout.

Prefer visual proof for UI work: desktop and mobile screenshots for each
meaningfully changed viewport, state, or flow, plus layout-audit and console
results for the changed UI target. If screenshots are impossible or irrelevant, provide
programmatic proof: focused test results, Playwright/Maestro traces, API
responses, migration dry runs, script output, logs, CI links, or command
summaries. Tie each evidence item to the behavior or risk it proves.

After the Phase 1 native gate has passed, Phase 2 is clean on the final target,
and final local validation has passed, ensure the reviewed branch has PR
evidence:

1. Check whether a PR already exists for the branch, such as with:

   ```sh
   gh pr view --json url,number,state,headRefName,baseRefName
   ```

2. Preserve the delivery shape chosen before implementation.

   - If the branch belongs to a planned or active stack, load `gh-stack`,
     inspect it with `gh stack view --json`, and use the skill's non-interactive
     submit workflow. Do not replace it with a standalone `gh pr create`.
   - Otherwise, create or update one standalone PR.

   Prefer draft PRs unless the user requested ready PRs. Push only the intended
   branches, preserve unrelated local changes, and do not include files outside
   the accepted review scope. Do not manufacture a new stack during closeout;
   if a monolithic reviewed branch should have been split, report that delivery
   blocker instead of rewriting reviewed history without approval.

3. Before creating or updating any PR body, load `pr-proof-pack` and follow it
   exactly: run its net-diff script, choose the smallest useful proof, validate
   Mermaid if used, and include verification results tied to the reviewed
   behavior. For a stack, run it on every branch against that PR's direct base
   and add a short position/dependency note to each body.

4. After any branch change made for PR creation or proof, rerun `pr-proof-pack`
   for that layer before updating its PR. If a lower layer changed, follow the
   `gh-stack` rebase/sync workflow, then refresh every affected upstack proof.

5. Once proof, review, validation, and CI are complete, summarize the findings,
   review fixes, verification, and anything still open from the
   `review-findings closeout` output. Apply the Review gate and Sign-off gate
   from `AGENTS.md`.
   This run satisfies the review gate only for its exact final head; any later
   branch change makes it stale. For a stack, apply both gates to every open PR
   bottom-to-top. Never create or remove the user's reaction.

If the target is a local-only patch, detached commit, non-GitHub repo,
uncommitted default-branch worktree, or another target where PR creation would
be unsafe or impossible, do not pretend the PR step succeeded. Report the review
result separately from the PR blocker and say what is needed to create the PR.

Push only when the user requested publish, ship, or PR update.
