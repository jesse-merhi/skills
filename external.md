# Third-party skills

Keep externally owned skills out of this repository unless their license and
update model are intentionally adopted. Prefer a small repo-owned adapter when
only part of an external workflow earns a permanent place in the skill loop.

## gh-stack

- **Source:** <https://github.com/github/gh-stack/tree/v0.1.0/skills/gh-stack>
- **CLI extension:** <https://github.com/github/gh-stack/releases/tag/v0.1.0>
- **License:** MIT
- **What it is:** GitHub's maintained agent workflow and CLI extension for
  planning, creating, submitting, syncing, and reviewing dependent pull
  requests as a stack.
- **Why it is external:** GitHub owns both the stack semantics and the CLI. The
  official skill should stay aligned with the installed extension instead of
  being copied into this repository.
- **Update model:** The skill and extension are pinned to `v0.1.0` at commit
  `a1b4a3d4d0bcde9ec3a78ab99b2d63af121857a9`. Review GitHub's release and
  skill changes together before updating the pin.

### Install

Install the pinned extension, then install its official skill at user scope for
the current harness. `--force` makes a reinstall converge on the reviewed
version instead of silently retaining a different version.

| Harness | Method |
| --- | --- |
| Claude Code | `gh extension install github/gh-stack --pin v0.1.0 --force && gh skill install github/gh-stack skills/gh-stack/SKILL.md --pin v0.1.0 --agent claude-code --scope user --force` |
| Codex | `gh extension install github/gh-stack --pin v0.1.0 --force && gh skill install github/gh-stack skills/gh-stack/SKILL.md --pin v0.1.0 --agent codex --scope user --force` |
| opencode | `gh extension install github/gh-stack --pin v0.1.0 --force && gh skill install github/gh-stack skills/gh-stack/SKILL.md --pin v0.1.0 --agent opencode --scope user --force` |
| Pi | `gh extension install github/gh-stack --pin v0.1.0 --force && gh skill install github/gh-stack skills/gh-stack/SKILL.md --pin v0.1.0 --agent pi --scope user --force` |

The installers own the external `gh-stack` skill and extension. Do not symlink
`gh-stack` from this repository.

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
  installer remains pinned to `skills@1.5.20`. Review upstream changes before
  deliberately updating either pin.

### Install

Run from the harness-level parent directory so the installer writes into the
normal global skills folder. Only Codex has been verified here; other harnesses
must skip this entry until a tested command is added. The installer cannot
clone a raw commit SHA as a GitHub tree ref, so the command first proves that
the upstream metadata branch still points at the reviewed commit and refuses to
install if it moved.

| Harness | Method |
| --- | --- |
| Codex | `test "$(git ls-remote https://github.com/mattpocock/skills.git refs/heads/codex-skill-metadata \| awk '{print $1}')" = "697d4ce9742da558fd1ba6697c8e9775e2e302dd" && (cd ~ && npx --yes skills@1.5.20 add 'https://github.com/mattpocock/skills/tree/codex-skill-metadata/skills/productivity/teach' --global --agent codex --skill teach --yes)` |

The installer owns the external skill files. Do not symlink `teach` from this
repo.

## Retired third-party skills

Retired entries remain here as cleanup tombstones. Run the removal command for
the current harness on every reinstall, even when the skill is already absent.
Do not reinstall a retired skill unless the user explicitly asks for it.

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
