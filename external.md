# Third-party skills

Keep externally owned skills out of this repository unless their license and
update model are intentionally adopted. Prefer a small repo-owned adapter when
only part of an external workflow earns a permanent place in the skill loop.

## Ownership model

| Category | Where the code lives | Who owns future behavior | Update rule |
| --- | --- | --- | --- |
| Repo-owned | This repository | This repository | Change and test here. |
| Repo-owned fork | This repository, with an upstream notice | This repository | Preserve attribution; upstream changes are input, not automatic policy. |
| External | Upstream installation | Upstream project | Pin and review upstream; do not copy it here. |

Current repo-owned forks include `writing-good-tests`, `writing-for-agents`,
`skill-cleaner`, `speak-fking-english`, and the internal references behind the
`design` router. Their skill files name the source and the behavior that differs
from upstream. Everything else is repo-owned unless its skill says otherwise.

## Browser interaction

Claude uses its available Chrome integration; Codex uses its native browser
tools. Do not install the separate browser-use skill. Removing that skill does
not uninstall browsers, their integrations, the CLI, or upstream caches.

## Stacked PR tooling

Keep the installed `gh stack` CLI extension. Use it for dependent PR chains and discover commands through `gh stack --help`; publication still needs the owning workflow's authority.

The separate external gh-stack skill is retired. Do not reinstall it or copy its command tutorial into another skill. Removing the skill must not remove the GitHub CLI, extension binary, package cache or repository.

## teach

- **Source:** <https://github.com/mattpocock/skills/tree/697d4ce9742da558fd1ba6697c8e9775e2e302dd/skills/productivity/teach>
- **License:** MIT
- **What it is:** A stateful teaching workflow. It grounds lessons in a learner
  mission, trusted resources, learning records, retrieval practice, reusable
  HTML lesson components, and quick-reference material.
- **Why it is external:** Matt Pocock owns the workflow and its update path. The
  upstream installer should own the installed files; this repository only pins
  the reviewed source and installer versions.
- **Update model:** The source is pinned to commit
  `697d4ce9742da558fd1ba6697c8e9775e2e302dd`, which adds Teach's Codex
  `agents/openai.yaml` metadata to the otherwise unchanged `v1.0.1` files. The
  installer is pinned to `skills@1.5.23`. Review upstream changes before
  deliberately updating either pin.

### Install

Run from the directory above the harness's config directory, `~`, so the
installer writes into the normal global skills folder. Only Codex has been
verified here; other harnesses must skip this entry until a tested command is
added. The installer cannot clone a raw commit SHA as a GitHub tree ref, so the
command first proves that
the upstream metadata branch still points at the reviewed commit and refuses to
install if it moved.

| Harness | Method |
| --- | --- |
| Codex | `test "$(git ls-remote https://github.com/mattpocock/skills.git refs/heads/codex-skill-metadata \| awk '{print $1}')" = "697d4ce9742da558fd1ba6697c8e9775e2e302dd" && (cd ~ && npx --yes skills@1.5.23 add 'https://github.com/mattpocock/skills/tree/codex-skill-metadata/skills/productivity/teach' --global --agent codex --skill teach --yes)` |

The installer owns the external skill files. Do not symlink `teach` from this
repo.

## Retired third-party skills

Retired entries remain here as cleanup tombstones. Run the removal command for
the current harness on every reinstall, even when the skill is already
absent. Do not reinstall a retired skill unless the user explicitly asks for it.

### impeccable

Impeccable was replaced by the repo-owned frontend design skills. Remove all
installer-owned copies so agent skill discovery cannot load the retired skill.

| Harness | Removal command |
| --- | --- |
| Claude Code | `rm -rf ~/.claude/skills/impeccable` |
| Codex | `rm -f ~/.codex/skills/impeccable && rm -rf ~/.agents/skills/impeccable` |
| opencode | `rm -rf ~/.config/opencode/skills/impeccable ~/.config/opencode/.opencode/skills/impeccable` |
| Pi | `rm -rf ~/.pi/agent/skills/impeccable ~/.pi/skills/impeccable` |

For Claude Code, also remove hook entries whose command targets
`skills/impeccable/scripts/hook.mjs` from `~/.claude/settings.local.json`.
Preserve unrelated settings and delete the file only when nothing remains.

Removing the skill directories is not enough. Impeccable's hook writes state
outside them, and that state survived two reinstalls because the commands above
never named it. Remove it on every reinstall, on every harness:

```sh
rm -rf ~/.impeccable ~/.codex/.impeccable
```

Every repository Impeccable ran in also holds its own `.impeccable/` hook cache.
List them, then remove the ones git does not track:

```sh
find ~/repos -maxdepth 2 -type d -name .impeccable
git -C <repo> ls-files .impeccable
```

Leave any `.impeccable/` path that `git ls-files` reports, such as a committed
`.impeccable/live/config.json`. Deleting a tracked file is a change to that
repository and belongs in its own branch and pull request, not in a reinstall.
Report those paths to the user instead.
