# Installation

You are an AI coding agent. The user has cloned this skills repository and
asked you to install it into your harness. Follow these steps in order.

Throughout this file, `REPO` refers to the absolute path of this cloned
repository.

## 1. Identify your harness

Figure out which harness you're running in:

- **Claude Code**: `~/.claude/`, `CLAUDE.md`, a `skills/` directory,
  `plugins/`
- **Codex CLI**: `~/.codex/`, `config.toml`, a `skills/` directory
- **opencode**: `~/.config/opencode/`, `AGENTS.md`, a `skills/` directory
- **Pi**: `~/.pi/agent/`, a `skills/` directory, `settings.json`
- **OpenClaw**: a running Gateway, the matching `openclaw` CLI, and
  `~/.openclaw/openclaw.json`

If you cannot determine the harness with confidence, ask the user before
proceeding.

Also resolve the exact active model identifier from the harness. Do not infer
it from writing style. The model selects which complete skill variant is
installed. A newer model in a known family uses that family's newest variant
and produces one informational update notice. An unknown family stops instead
of receiving an unrelated prompt.

## 2. Link global instructions

This repo owns the user's global agent instructions:

- `REPO/AGENTS.md` holds shared instructions for every harness.
- `REPO/CLAUDE.md` is Claude Code only. It imports `AGENTS.md` via
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

OpenClaw does not receive a global-instructions link from this repo. Skip this
step when installing only into OpenClaw.

## 3. Configure Claude orchestration

For Claude Code, this repo owns three user-level agents under
`REPO/claude/agents/`:

- `fable-orchestrator` is the default main agent;
- `opus-worker` implements settled changes and production UI in Opus 5;
- `codex-reviewer` relays code-centric review to GPT-5.6 Sol High.

Survey `~/.claude/agents/` before changing it. Link each repo agent by filename
into that real directory. Replace a matching repo symlink or a dead symlink,
but ask before replacing a real file or a symlink owned elsewhere. Preserve all
unrelated agents.

Set `agent` to `fable-orchestrator` in `~/.claude/settings.json`, preserving
every other setting. If `agent` already names something else, ask before
replacing it. Then validate the agent directory:

```sh
claude plugin validate ~/.claude/agents
```

The default main agent takes effect in the next Claude Code session. Skip this
step for other harnesses.

## 4. Configure Codex interaction

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

## 5. Install repo runtime dependencies

Repo-owned TypeScript helpers require Node 24 or newer and the exact Bun
version declared in `package.json`. From `REPO`, run:

```sh
node -e 'if (Number(process.versions.node.split(".")[0]) < 24) process.exit(1)'
bun ci
```

Stop and report the missing prerequisite if either command is unavailable or
fails. Do not substitute a global TypeScript, Effect, or package installation.

## 6. Survey existing skills

For Claude Code, Codex, opencode, or Pi, inventory the target skills directory
before touching anything:

| Harness | Skills target |
| --- | --- |
| Claude Code | `~/.claude/skills` |
| Codex | `~/.codex/skills` |
| opencode | `~/.config/opencode/skills` |
| Pi | `~/.pi/agent/skills` |

Classify existing entries:

1. A matching skill from this repo, including a link into this repo's generated
   skill view: safe to replace with a symlink.
2. A third-party skill not in this repo: leave it alone unless `external.md`
   explicitly says to install, update, replace, or remove it.
3. A hand-written local skill not in this repo: ask before touching it.
4. A dead symlink: safe to remove.
5. Obvious junk: ask before deleting.

Skip this step for OpenClaw; its existing skills are inspected after connecting
the repo in step 8.

## 7. Materialize and link one model variant

For Claude Code, Codex, opencode, or Pi, keep the target skills directory real
and retain one per-skill symlink. Point those links at a generated view, not at
`REPO/skills` directly. Each view contains shared resource links plus exactly
one model-specific `SKILL.md`, so invoking a skill causes no routing hop.

Choose a view outside the target skills directory:

| Harness | View root |
| --- | --- |
| Claude Code | `~/.claude/.skill-variants/jesse-merhi-skills` |
| Codex | `~/.codex/.skill-variants/jesse-merhi-skills` |
| opencode | `~/.config/opencode/.skill-variants/jesse-merhi-skills` |
| Pi | `~/.pi/agent/.skill-variants/jesse-merhi-skills` |

Build or switch the view with:

```sh
node REPO/skills/model-writing-guides/scripts/materialize-skill-variants.mjs \
  --source REPO/skills \
  --output VIEW_ROOT \
  --model ACTIVE_MODEL_ID \
  --format json
```

Read the JSON result. If `notice` is present and no earlier model-profile
notice appeared in this installation task, show it once and continue. The
materializer refuses to replace an unmarked directory or a view owned by
another repository clone.

Then:

1. Create the target skills directory if it does not exist.
2. If the target skills directory is a symlink, stop and ask unless it points at
   an old whole-directory install of this repo.
3. Remove dead symlinks identified during the survey. This retires repo-owned
   skills after a rename, such as `writing-great-skills` becoming
   `writing-for-agents`, without touching real directories or live third-party
   links.
4. Discover each immediate skill directory under `VIEW_ROOT`. Read its
   `SKILL.md` frontmatter and stop if two entries have the same `name`.
5. Link `<target>/<name>` to `VIEW_ROOT/<name>`.
   - Replace a link to this repo or this repo's previous generated view.
   - Leave an identical link unchanged.
   - Ask before replacing a real directory with user-authored changes or a
     symlink owned elsewhere.

For Claude Code, also merge the following command hook into both `SessionStart`
and `PostModelSwitch` in `~/.claude/settings.json`, preserving all existing
settings and hook handlers:

```text
node REPO/skills/model-writing-guides/scripts/materialize-skill-variants.mjs --source REPO/skills --output VIEW_ROOT
```

Both events pass their JSON input on stdin. `SessionStart` supplies `model` and
`PostModelSwitch` supplies `to_model`; the materializer accepts either. A
fallback notice is stored by `session_id`, so it appears at most once in that
session. Validate the merged settings with the installed Claude Code build. If
that build does not support `PostModelSwitch`, leave the `SessionStart` handler
installed, report that in-session switching requires reinstalling the view,
and do not leave an invalid handler behind.

The hook changes what later skill invocations load. Skill instructions already
present in the conversation remain there until a fresh session; do not claim
that the hook removes them.

## 8. Connect a running OpenClaw Gateway

Only run this step when the user asked to install these skills into OpenClaw.
OpenClaw discovers nested `SKILL.md` files from an extra skills directory. Build
the same generated view for OpenClaw's configured model and point OpenClaw at
that view instead of `REPO/skills` so it receives the selected model prompt.

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

Resolve the configured model, then materialize into
`~/.openclaw/.skill-variants/jesse-merhi-skills` with the command from step 7.
Preserve every existing entry in `skills.load.extraDirs`, append that absolute
view path once, remove exact duplicates, and write the complete JSON array back
with `--strict-json`. For example, when the existing array is empty:

```sh
openclaw config set skills.load.extraDirs '["/absolute/path/to/generated/view"]' --strict-json
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
managed Gateway, use `openclaw gateway restart`. Re-materialize the view before
starting a session with a different model; OpenClaw has no Claude Code model
switch hook.

## 9. Reconcile third-party skills

Read `external.md`. For each active or retired entry, run only the install or
removal command for the current harness. Skip entries that do not list your
harness and report the skip. Retired entries are intentional cleanup
tombstones: keep processing them on every reinstall so old external copies do
not survive after this repository stops using them.

Do not symlink third-party skills from this repo. Their own installer owns
those files.

## 10. Verify repo-owned CLIs

The `review-findings` CLI runs directly from the linked skill and uses the
repo-owned Effect runtime installed in step 5. Verify it can resolve that
runtime and report its SQLite database path:

```sh
REPO/skills/code-review/scripts/review-findings path
```

Retire any `AGENT_REVIEW_FINDINGS_BIN` export from harness configuration.
That override belonged to the removed Rust installation and can silently select
a CLI that lacks the required scope commands. The skill-owned launcher above is
the only supported entrypoint.

## 11. Verify

Run:

```sh
./tests/skills-test
./tests/review-findings-test
bun run validate:effect
```

Report:

- harness detected
- OpenClaw connected or skipped; when connected, report the extra skills root,
  collisions or ineligible skills, and whether a new session or restart is
  required
- Codex Default-mode question UI enabled, unsupported, or skipped
- skills linked
- selected model profile and whether it was an exact match or fallback
- Claude Code SessionStart/PostModelSwitch hooks installed, unsupported, or skipped
- existing local skills preserved
- third-party installs run or skipped
- repo runtime dependencies installed
- repo-owned CLIs verified
- test result
