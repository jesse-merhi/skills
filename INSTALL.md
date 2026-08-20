# Installation

You are an AI coding agent. The user has cloned this skills repository and
asked you to install it into your agent tool. Follow these steps in order.

Throughout this file, `REPO` refers to the absolute path of this cloned
repository.

## 1. Identify your agent tool

Figure out which agent tool you're running in:

- **Claude Code**: `~/.claude/`, `CLAUDE.md`, a `skills/` directory,
  `plugins/`
- **Codex CLI**: `~/.codex/`, `config.toml`, a `skills/` directory
- **opencode**: `~/.config/opencode/`, `AGENTS.md`, a `skills/` directory
- **Pi**: `~/.pi/agent/`, a `skills/` directory, `settings.json`
- **OpenClaw**: a running Gateway, the matching `openclaw` CLI, and
  `~/.openclaw/openclaw.json`

If you cannot determine the agent tool with confidence, ask the user before
proceeding.

## 2. Link global instructions

This repo owns the user's global agent instructions:

- `REPO/AGENTS.md` holds shared instructions for every agent tool.
- `REPO/CLAUDE.md` is Claude Code only. It imports `AGENTS.md` via
  `@AGENTS.md` and layers Claude-specific content (model delegation policy)
  on top. Never move Claude-specific content into `AGENTS.md`: Codex reads
  `AGENTS.md` directly and must not see instructions about delegating to
  itself.

Link per agent tool (replace existing dead symlinks; ask before replacing real
files with local edits):

| Agent tool | Command |
| --- | --- |
| Claude Code | `ln -sf REPO/CLAUDE.md ~/.claude/CLAUDE.md` and `ln -sf REPO/AGENTS.md ~/.claude/AGENTS.md` |
| Codex | `ln -sf REPO/AGENTS.md ~/.codex/AGENTS.md` |
| opencode | `ln -sf REPO/AGENTS.md ~/.config/opencode/AGENTS.md` |

The extra `~/.claude/AGENTS.md` symlink exists only so the relative
`@AGENTS.md` import in `CLAUDE.md` resolves regardless of whether the agent tool
resolves imports against the symlink location or the real file. Claude Code
does not load `~/.claude/AGENTS.md` by itself.

OpenClaw does not receive a global-instructions link from this repo. Skip this
step when installing only into OpenClaw.

## 3. Configure Codex interaction

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

Skip this step for other agent tools.

## 4. Install repo runtime dependencies

Repo-owned TypeScript helpers require Node 24 or newer and the exact Bun
version declared in `package.json`. From `REPO`, run:

```sh
node -e 'if (Number(process.versions.node.split(".")[0]) < 24) process.exit(1)'
bun ci
```

Stop and report the missing prerequisite if either command is unavailable or
fails. Do not substitute a global TypeScript, Effect, or package installation.

## 5. Survey existing skills

For Claude Code, Codex, opencode, or Pi, inventory the target skills directory
before touching anything:

| Agent tool | Skills Target |
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

Skip this step for OpenClaw; its existing skills are inspected after connecting
the repo in step 7.

## 6. Link skills

For Claude Code, Codex, opencode, or Pi, always use per-skill symlinks. The
target skills directory should remain a real directory; each repo skill gets
its own symlink inside it. Skip this step for OpenClaw.

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

## 7. Connect a running OpenClaw Gateway

Only run this step when the user asked to install these skills into OpenClaw.
OpenClaw discovers nested `SKILL.md` files from an extra skills directory, so
point it at `REPO/skills` directly. Do not create per-skill copies or symlinks
for OpenClaw.

Use the `openclaw` CLI that belongs to the running Gateway. Before changing its
configuration, run:

```sh
openclaw --version
openclaw config validate
openclaw config get skills.load.extraDirs --json
```

If validation fails, stop. The CLI may be older than the Gateway or its config;
do not let a mismatched CLI rewrite that file. A missing
`skills.load.extraDirs` value means an empty array.

Resolve `REPO/skills` to an absolute, physical path. Preserve every existing
entry in `skills.load.extraDirs`, append that path once, remove exact
duplicates, and write the complete JSON array back with `--strict-json`. For
example, when the existing array is empty:

```sh
openclaw config set skills.load.extraDirs '["/absolute/path/to/repo/skills"]' --strict-json
openclaw config validate
```

Do not use that example unchanged when entries already exist: include them in
the array you write back. Extra directories have the lowest precedence, so a
higher-priority skill with the same name wins. Check and report collisions and
ineligible skills with:

```sh
openclaw skills list --json
openclaw skills check --json
```

Current OpenClaw builds apply `skills.*` configuration without restarting the
Gateway. Start a new OpenClaw session so it receives the updated skill set. If
the CLI explicitly says a restart is required, follow that instruction; for a
managed Gateway, use `openclaw gateway restart`.

## 8. Reconcile third-party skills

Read `external.md`. For each active or retired entry, run only the install or
removal command for the current agent tool. Skip entries that do not list your
agent tool and report the skip. Retired entries are intentional cleanup
tombstones: keep processing them on every reinstall so old external copies do
not survive after this repository stops using them.

Do not symlink third-party skills from this repo. Their own installer owns
those files.

## 9. Verify repo-owned CLIs

The `review-findings` CLI runs directly from the linked skill and uses the
repo-owned Effect runtime installed in step 4. Verify it can resolve that
runtime and report its SQLite database path:

```sh
REPO/skills/code-review/scripts/review-findings path
```

Retire any `AGENT_REVIEW_FINDINGS_BIN` export from agent tool configuration.
That override belonged to the removed Rust installation and can silently select
a CLI that lacks the required scope commands. The skill-owned launcher above is
the only supported entrypoint.

## 10. Verify

Run:

```sh
./tests/skills-test
./tests/review-findings-test
bun run validate:effect
```

Report:

- agent tool detected
- OpenClaw connected or skipped; when connected, report the extra skills root,
  collisions or ineligible skills, and whether a new session or restart is
  required
- Codex Default-mode question UI enabled, unsupported, or skipped
- skills linked
- existing local skills preserved
- third-party installs run or skipped
- repo runtime dependencies installed
- repo-owned CLIs verified
- test result
