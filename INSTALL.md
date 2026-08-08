# Installation

You are an AI coding agent. The user has cloned this skills repository and
asked you to install it into your harness. Follow these steps in order.

Throughout this file, `REPO` refers to the absolute path of this cloned
repository.

## 1. Identify Your Harness

Figure out which harness you're running in:

- **Claude Code**: `~/.claude/`, `CLAUDE.md`, a `skills/` directory,
  `plugins/`
- **Codex CLI**: `~/.codex/`, `config.toml`, a `skills/` directory
- **opencode**: `~/.config/opencode/`, `AGENTS.md`, a `skills/` directory
- **Pi**: `~/.pi/agent/`, a `skills/` directory, `settings.json`

If you cannot determine the harness with confidence, ask the user before
proceeding.

## 2. Link Global Instructions

This repo owns the user's global agent instructions:

- `REPO/AGENTS.md` — shared, harness-agnostic instructions.
- `REPO/CLAUDE.md` — Claude Code only. It imports `AGENTS.md` via
  `@AGENTS.md` and layers Claude-specific content (model delegation policy)
  on top. Never move Claude-specific content into `AGENTS.md`: Codex reads
  `AGENTS.md` directly and must not see instructions about delegating to
  itself.

Link per harness (replace existing dead symlinks; ask before replacing real
files with local edits):

| Harness | Command |
| --- | --- |
| Claude Code | `ln -sf REPO/CLAUDE.md ~/.claude/CLAUDE.md` and `ln -sf REPO/AGENTS.md ~/.claude/AGENTS.md` |
| Codex | `ln -sf REPO/AGENTS.md ~/.codex/AGENTS.md` |
| opencode | `ln -sf REPO/AGENTS.md ~/.config/opencode/AGENTS.md` |

The extra `~/.claude/AGENTS.md` symlink exists only so the relative
`@AGENTS.md` import in `CLAUDE.md` resolves regardless of whether the harness
resolves imports against the symlink location or the real file. Claude Code
does not load `~/.claude/AGENTS.md` by itself.

## 3. Configure Codex Interaction

For Codex, enable the native structured question UI in Default mode when the
installed build supports it:

```sh
codex features list
codex features enable default_mode_request_user_input
```

If `default_mode_request_user_input` is absent from the feature list, report
that the installed Codex version does not support it and continue installing
the skills. A new Codex task or app restart may be required before an existing
session exposes the question UI.

Skip this step for other harnesses.

## 4. Survey Existing Skills

Before touching anything, inventory the target skills directory for the current
harness:

| Harness | Skills Target |
| --- | --- |
| Claude Code | `~/.claude/skills` |
| Codex | `~/.codex/skills` |
| opencode | `~/.config/opencode/skills` |
| Pi | `~/.pi/agent/skills` |

Classify existing entries:

1. A matching skill from this repo: safe to replace with a symlink.
2. A third-party skill not in this repo: leave it alone unless `external.md`
   explicitly says to install, update, replace, or remove it.
3. A hand-written local skill not in this repo: ask before touching it.
4. A dead symlink: safe to remove.
5. Obvious junk: ask before deleting.

## 5. Link Skills

Always use per-skill symlinks. The target skills directory should remain a real
directory; each repo skill gets its own symlink inside it.

Discover every `SKILL.md` under `REPO/skills/`, recursively and following
directory symlinks. Install by the frontmatter `name`, not by folder path. This
allows grouped skills such as `skills/openclaw/clawhub-local-test/` to install
as `<target>/clawhub-local-test`.

Procedure:

1. Create the target skills directory if it does not exist.
2. If the target skills directory is a symlink, stop and ask unless it points at
   an old whole-directory install of this repo.
3. Remove dead symlinks identified during the survey. This retires repo-owned
   skills after a rename, such as `writing-great-skills` becoming
   `writing-for-agents`, without touching real directories or live third-party
   links.
4. For each discovered skill:
   - read `SKILL.md` frontmatter `name`
   - stop if two repo skills have the same name
   - create `<target>/<name>` as a symlink to the directory containing
     `SKILL.md`
   - if `<target>/<name>` already points there, skip it
   - if `<target>/<name>` is a real directory, compare it before replacing and
     ask when it contains user-authored changes
   - if `<target>/<name>` is a symlink elsewhere, stop and ask

## 6. Reconcile Third-Party Skills

Read `external.md`. For each active or retired entry, run only the install or
removal command for the current harness. Skip entries that do not list your
harness and report the skip. Retired entries are intentional cleanup
tombstones: keep processing them on every reinstall so old external copies do
not survive after this repository stops using them.

Do not symlink third-party skills from this repo. Their own installer owns
those files.

## 7. Install Repo-Owned Helper Binaries

Some skills include local helper binaries. Install the Rust `review-findings`
binary so `code-review` can record findings, verification commands, and
closeouts in a fast local SQLite database:

```sh
REPO/skills/code-review/scripts/install-review-findings
```

By default this writes:

```text
~/.local/bin/review-findings
```

If the harness supports local environment variables, record the absolute helper
path as `AGENT_REVIEW_FINDINGS_BIN`. Otherwise agents can use the skill-local
launcher at `REPO/skills/code-review/scripts/review-findings`.

Verify:

```sh
${AGENT_REVIEW_FINDINGS_BIN:-$HOME/.local/bin/review-findings} path
```

## 8. Verify

Run:

```sh
./tests/skills-test
./tests/review-findings-test
```

Report:

- harness detected
- Codex Default-mode question UI enabled, unsupported, or skipped
- skills linked
- existing local skills preserved
- third-party installs run or skipped
- helper binaries installed or skipped
- test result
