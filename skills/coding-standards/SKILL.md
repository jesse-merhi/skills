---
name: coding-standards
description: 'Apply the coding-standards catalog to a repository as working ESLint and Python enforcement, sync standards already vendored in a repository against the catalog, or translate the catalog to a new language ecosystem. Use only when the user explicitly invokes this skill.'
---

# Coding standards

`catalog.json` in this skill directory is the record of every standard: what it
asks for, the principle behind it, and the ESLint or Python enforcement that
makes it mechanical instead of a review comment. All three modes read that file
and nothing else decides what the standards are.

Choose the mode that matches the request, then read only its reference:

- **Apply:** bootstrap the standards into a target repository — rules, presets,
  config, dependencies, and the commands that run them. Read
  [apply.md](references/apply.md).
- **Sync:** reconcile standards already vendored in a target repository against
  the current catalog. Read [sync.md](references/sync.md).
- **Translate:** add a new language ecosystem column to the catalog in this
  repository. Read [translate.md](references/translate.md).

Only translate writes `catalog.json`; read
[catalog-format.md](references/catalog-format.md) before writing anything into
it. Apply and sync read the catalog and never modify it.

## Locate the catalog

Every mode starts here.

This skill directory is normally a symlink inside the harness skills folder, so
the path this file was loaded from is not where the catalog lives. Resolve the
real directory holding this SKILL.md with `realpath` or `readlink -f` and read
`catalog.json` from there. Then record the catalog source: the `git remote` URL
and `git rev-parse HEAD` of the repository that directory belongs to.

Check that the commit is reachable from the remote: `git branch -r --contains
<sha>` returns something, or `git merge-base --is-ancestor <sha> origin/HEAD`
succeeds. When it is not, say so in the report, because a manifest pointing at
an unpushed commit cannot be synced from another machine.

Done when `catalog.json` has been read from a resolved real path, the source
repository URL and commit SHA are both written down, and the commit is either
reachable from the remote or reported as not. `apply` records them in the target
manifest and `sync` compares against them, so a guessed path silently produces a
manifest that points at nothing.

## Report

Every mode ends by reporting the catalog commit it worked from, each file it
changed in the target and why, and the validation commands it ran with their
results.

Name what was deliberately left undone — a preset skipped for a missing
dependency, an install the user declined, a locally modified file left alone —
so the next run resumes instead of rediscovering it.
