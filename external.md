# Third-party skills

Keep externally owned skills out of this repository unless their license and
update model are intentionally adopted. Prefer a small repo-owned adapter when
only part of an external workflow earns a permanent place in the skill loop.

## browser-use

- **Source:** <https://github.com/browser-use/browser-use/tree/0.13.7>
- **Runtime dependency:** <https://github.com/browser-use/browser-harness/tree/v0.1.8>
- **License:** MIT
- **What it is:** Browser Use's maintained Claude skill and CLI for controlling
  a permitted local Chrome-family browser, including Chrome and Dia, through
  the Chrome DevTools Protocol.
- **Why it is external:** Browser Use owns the browser connection, interaction
  helpers, consent flow, and current Claude instructions. The official skill
  should stay aligned with the installed CLI instead of being copied here.
- **Update model:** `browser-use` is pinned to `0.13.7` at commit
  `f0aa3a8bb03779c71a5aa262d389e3bfe6b77cdc`; its packaged
  `browser-harness` dependency is `0.1.8`, tagged at commit
  `dbe6f8f22ba65170e2d4b8f17754c704d008fe49`. Review both projects before
  updating either pin.

### Install

Install the pinned CLI first, then let that exact installation write its
version-matched skill. The local browser requires the human to enable remote
debugging and approve its connection prompt; the agent must not bypass either
consent step.

| Agent tool | Method |
| --- | --- |
| Claude Code | `uv tool install --python 3.12 --force 'browser-use==0.13.7' && browser-use skill install --target claude --no-install --force` |

The Browser Use installer owns the external skill. Do not symlink or copy a
`browser-use` skill from this repository. Other agent tools must skip this entry
until a tested command and workflow are added.

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
the current agent tool. `--force` makes a reinstall converge on the reviewed
version instead of silently retaining a different version.

| Agent tool | Method |
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

Run from the directory above the agent tool's config directory, `~`, so the
installer writes into the
normal global skills folder. Only Codex has been verified here; other agent
tools must skip this entry until a tested command is added. The installer cannot
clone a raw commit SHA as a GitHub tree ref, so the command first proves that
the upstream metadata branch still points at the reviewed commit and refuses to
install if it moved.

| Agent tool | Method |
| --- | --- |
| Codex | `test "$(git ls-remote https://github.com/mattpocock/skills.git refs/heads/codex-skill-metadata \| awk '{print $1}')" = "697d4ce9742da558fd1ba6697c8e9775e2e302dd" && (cd ~ && npx --yes skills@1.5.20 add 'https://github.com/mattpocock/skills/tree/codex-skill-metadata/skills/productivity/teach' --global --agent codex --skill teach --yes)` |

The installer owns the external skill files. Do not symlink `teach` from this
repo.

## Retired third-party skills

Retired entries remain here as cleanup tombstones. Run the removal command for
the current agent tool on every reinstall, even when the skill is already
absent. Do not reinstall a retired skill unless the user explicitly asks for it.

### impeccable

Impeccable was replaced by the repo-owned frontend design skills. Remove all
installer-owned copies so agent skill discovery cannot load the retired skill.

| Agent tool | Removal command |
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
never named it. Remove it on every reinstall, on every agent tool:

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
