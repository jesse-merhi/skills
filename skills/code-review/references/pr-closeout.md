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

2. If no PR exists and the target is a PR-capable branch, create one. Prefer a
   draft PR unless the user requested a ready PR. If the branch is not pushed,
   push it first. Preserve unrelated local changes and do not include files
   outside the accepted review scope.

3. Before creating or updating the PR body, load `pr-proof-pack` and follow it
   exactly: run its net-diff script, choose the smallest useful proof, validate
   Mermaid if used, and include verification results tied to the reviewed
   behavior.

4. After any branch change made for PR creation or proof, rerun `pr-proof-pack`
   before updating the PR.

If the target is a local-only patch, detached commit, non-GitHub repo,
uncommitted default-branch worktree, or another target where PR creation would
be unsafe or impossible, do not pretend the PR step succeeded. Report the review
result separately from the PR blocker and say what is needed to create the PR.

Push only when the user requested publish, ship, or PR update.
