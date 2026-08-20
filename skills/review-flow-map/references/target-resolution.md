# Target resolution

Prefer a PR number/URL or explicit git range. If absent, use the current branch
against the default base.

For a PR:

```sh
gh pr view <pr> --json title,body,files,commits,changedFiles,additions,deletions
gh pr diff <pr> --name-only
gh pr diff <pr> --patch
```

For a git range:

```sh
git diff --name-only <base>...HEAD
git diff --stat <base>...HEAD
git diff <base>...HEAD
```
