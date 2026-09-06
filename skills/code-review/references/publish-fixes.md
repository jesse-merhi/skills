# Publish fixes

Full native-then-cold `code-review` grants one normal final push to an existing PR authored by the authenticated GitHub account. Finish both phases, selected local validation and saved review completion before publishing. Push only reviewed commits; unresolved findings or incomplete validation keep fixes local. Native-only, cold-only and bot-only reviews have no automatic push authority here; separately authorized publication retains its own scope.

## Verify the existing destination

```sh
gh api user --jq .login
gh pr view "<pr-number>" --repo "<owner/repo>" \
  --json url,author,headRefName,headRefOid,headRepository,headRepositoryOwner,baseRefName,isCrossRepository
git branch --show-current
git rev-parse HEAD
git status --porcelain
git remote get-url --push --all "<remote>"
gh repo view "<head-owner/head-repo>" --json defaultBranchRef
git ls-remote --heads "<verified-push-url>" "refs/heads/<head-branch>"
```

Require the PR author to match the authenticated login, the local branch to match the PR head, a clean tree and the reviewed SHA to match local HEAD. Verify the push URL identifies the PR's head repository, including forks, and its existing remote branch matches GitHub's head SHA. Never infer the destination from the default remote. Automatic authority excludes the default branch, force-pushes, new branches and other PRs. Missing or conflicting ownership/destination evidence means report the local result and ask; separate explicit user authorization may permit a different action.

## Push the reviewed commits

For a single PR, substitute the verified URL, reviewed SHA and existing branch:

```sh
git push --no-follow-tags --recurse-submodules=no "<verified-push-url>" \
  "<reviewed-sha>:refs/heads/<head-branch>"
git ls-remote --heads "<verified-push-url>" "refs/heads/<head-branch>"
```

Require the resulting remote SHA to equal the reviewed SHA. A rejected push is a blocker, not permission to force or rewrite the branch.

For a planned stack, check every affected PR's ownership and review completion before any push. Discover its existing submission flow with `gh stack --help`, preserve the stack and submit bottom-to-top only if it stays within normal pushes to those verified existing heads. If it requires force, new destinations or unreviewed changes, stop rather than replacing the stack with a standalone PR.

This workflow ends at review and authorized push; it does not invoke proof-pack, human sign-off, merge or another delivery workflow. Global readiness and merge gates still apply when those actions are separately requested.
