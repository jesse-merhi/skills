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

## Local PR turns

- **Source:** [jesse-merhi/repo-queue](https://github.com/jesse-merhi/repo-queue), the upstream RepoQ project.
- **Pinned revision:** `0ea788bd5e34db320b06641761a460fbd652b72d` from [PR #1](https://github.com/jesse-merhi/repo-queue/pull/1). This pins the TypeScript package and complete skill variants. Update it deliberately after validation; do not track a moving branch.
- **Ownership:** repo-queue owns the CLI and complete skill variants. This repository owns the default merge-routing rule in `AGENTS.md`. Do not copy the workflow into a repo-owned skill or change dotfiles to install it.
- **Verified scope:** Codex desktop and live Claude Code each passed registration → original-session wake → claim → done in isolated synthetic queues. Live Claude stays open; a restricted native sender uses its normal configured permission mode and consumes an extra sender model turn. Native acceptance can still be held or refused by Claude; only a successful claim proves owner action. Exited Claude sessions retain resume support. Desktop Code is eligible when it exposes a compatible local inbox; general Chat/Cowork and cloud sessions are separate surfaces. Follow upstream recovery guidance instead of forcing delivery.

### Install the pinned CLI and skill

This entry is for Codex and Claude Code only. Run installation when the user requests queue setup or installation of this skills repository; a merge request alone does not authorize installing missing dependencies. Preserve unrelated skills and settings. Start by checking `command -v repo-queue`, `~/.local/bin/repo-queue`, and the harness's `skills/repo-queue`. If any existing destination has another owner or local edits, stop before replacing it. Treat a foreign executable as an unavailable queue, not as the trusted transport. An unchanged installation at this pin needs no reinstall.

Obtain the exact revision, build its package, and install the compiled command in a stable prefix. Node 24.13+ and npm are prerequisites; install missing prerequisites only with the user's authority. Do not run the background service from a temporary development worktree:

```sh
queue_revision=0ea788bd5e34db320b06641761a460fbd652b72d
queue_checkout="$HOME/.local/share/repo-queue/$queue_revision"
mkdir -p "$HOME/.local/share/repo-queue" "$HOME/.local/bin"
gh repo clone jesse-merhi/repo-queue "$queue_checkout" -- --no-checkout
git -C "$queue_checkout" checkout --detach "$queue_revision"
test "$(git -C "$queue_checkout" rev-parse HEAD)" = "$queue_revision"
(cd "$queue_checkout" && npm ci --ignore-scripts && npm run validate && npm pack)
npm install --global --prefix "$HOME/.local" --ignore-scripts "$queue_checkout/repoq-0.1.0.tgz"
```

These commands assume the checked destinations are absent. On reinstall, inspect and reuse a clean matching checkout and package installation; never overwrite an unrelated path. For an existing Python preview, follow the ordered upgrade and outstanding-wake reconciliation in upstream `docs/installation.md`. Move only the verified owned Python bin symlink to an unused backup name before npm installation, retaining its resolved target. Preserve reservations and the old executable for outstanding wake commands. The TypeScript CLI supports macOS and Linux, uses built-in SQLite, and has no third-party runtime dependencies. The relevant agent CLI must be authenticated. If `~/.local/bin` is absent from PATH, use its absolute executable path and report that fact rather than editing shell configuration implicitly.

Install the **whole** `skills/repo-queue` directory from that revision into the harness's skill directory. For Codex, use the available Skill Installer helper with the repository, revision and path above. For Claude, its `--dest ~/.claude/skills` option installs to the correct location as well. The helper's authenticated archive-download mode supports exact revisions. Select the complete `variants/gpt-6-astra.md`, `variants/gpt-5.6.md`, `variants/claude-fable-5.1.md`, or `variants/claude-opus-5.md` as the installed `SKILL.md` according to the harness's current model; preserve the source `BASE.md` and other variants. Do not change the model. Other installers may copy the directory from the verified checkout and select the same variant.

Materialize the selected variant by copying it to the installed `SKILL.md`; unlink a verified RepoQ `SKILL.md` symlink first so its target is preserved. The npm tarball includes the variants but omits that source symlink. Verify `repo-queue --help`, the installed skill and selected variant, then run:

```sh
repo-queue start
repo-queue status
```

A fresh session discovers the skill. Already-running tasks need to load it explicitly; installation does not send them messages or make them stop ongoing work. The dispatcher survives ended turns, but must be started again after reboot. The skill starts it idempotently before registration. Installing this entry grants no merge, publication, paid-CI or approval authority.

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
