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

## 3. Survey Existing Skills

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

## 4. Link Skills

Always use per-skill symlinks. The target skills directory should remain a real
directory; each repo skill gets its own symlink inside it.

Discover every `SKILL.md` under `REPO/skills/`, recursively and following
directory symlinks. Install by the frontmatter `name`, not by folder path. This
allows grouped skills such as `skills/openclaw/openclaw-local-test/` to install
as `<target>/openclaw-local-test`.

Procedure:

1. Create the target skills directory if it does not exist.
2. If the target skills directory is a symlink, stop and ask unless it points at
   an old whole-directory install of this repo.
3. For each discovered skill:
   - read `SKILL.md` frontmatter `name`
   - stop if two repo skills have the same name
   - create `<target>/<name>` as a symlink to the directory containing
     `SKILL.md`
   - if `<target>/<name>` already points there, skip it
   - if `<target>/<name>` is a real directory, compare it before replacing and
     ask when it contains user-authored changes
   - if `<target>/<name>` is a symlink elsewhere, stop and ask

## 5. Reconcile Third-Party Skills

Read `external.md`. For each active or retired entry, run only the install or
removal command for the current harness. Skip entries that do not list your
harness and report the skip. Retired entries are intentional cleanup
tombstones: keep processing them on every reinstall so old external copies do
not survive after this repository stops using them.

Do not symlink third-party skills from this repo. Their own installer owns
those files.

## 6. Install Repo-Owned Helper Binaries

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

## 7. Verify

Run:

```sh
./tests/skills-test
./tests/review-findings-test
```

Report:

- harness detected
- skills linked
- existing local skills preserved
- third-party installs run or skipped
- helper binaries installed or skipped
- test result
