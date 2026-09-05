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

Resolve the intended model from the user's request or the harness's actual
configuration, not from writing style. This repository supports GPT-5.6,
GPT-6 Astra, Claude Fable 5.1, and Claude Opus 5. A newer model in a known family
uses its nearest preceding variant and produces an informational update notice.
Installation stops on an unknown family. `--require-exact` also rejects any
fallback, including a missing variant in one skill.

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

## 3. Configure Claude review

Claude Code uses its normal main session with shared policy from `AGENTS.md`
and review routing from `CLAUDE.md`. This repo owns one user-level agent,
`REPO/claude/agents/codex-reviewer.md`, which relays code-centric review to
Astra at medium. No custom main agent is required.

Survey `~/.claude/agents/` before changing it. Link `codex-reviewer.md`
into that real directory. Replace a matching repo symlink or a dead symlink,
but ask before replacing a real file or a symlink owned elsewhere. Preserve all
unrelated agents.

For an existing installation, remove the `agent` key from
`~/.claude/settings.json` only when its value is exactly `fable-orchestrator`.
Leave a missing key or any other value unchanged, and preserve every other
setting. Do not replace it with another custom main agent.

Retire `fable-orchestrator.md` and the previously deleted `opus-worker.md`
only when each is a symlink whose stored target is the matching file under
`REPO/claude/agents/`, or a previous clone's matching path that you have verified
belongs to this repository. Preserve real files and links owned elsewhere.
Then validate the agent directory:

```sh
claude plugin validate ~/.claude/agents
```

The main-agent migration takes effect in the next Claude Code session. Preserve
the user's selected model and install its matching skills. Switching skill
files does not switch the model. Skip this step for other harnesses.

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

Link `REPO/codex/findings-reviewer.config.toml` to
`${CODEX_HOME:-$HOME/.codex}/findings-reviewer.config.toml`. Survey the
destination first: replace only a matching repo-owned or dead symlink, ask
before replacing a real file or another owner's link, and preserve unrelated
profiles. Do not change the default profile or the user's `config.toml`.

The preset uses native profile files and name-based `skills.config` exclusions,
verified with Codex 0.153.1. If the installed build lacks either capability,
report that the preset is unavailable instead of installing a partial filter
or upgrading Codex automatically. Select it only for findings-only sessions:

```sh
codex --profile findings-reviewer review --base main
codex exec --profile findings-reviewer "Inspect this diff and return findings only."
```

The `skills/code-review/scripts/codex-review` helper selects this profile for
native reviews whenever the installed file exists. Its `--dry-run` output shows
the selection. Without the file it uses the ordinary native configuration;
an installed but invalid or unsupported profile fails rather than silently
rerunning without the filter. Authentication probes and session archiving do
not select the reviewer profile.

Keep coordinators and delegated until-clean workflows on their normal profile.
In-chat spawn tools without a profile-selection parameter retain their normal
skill catalog; do not claim this preset filters those children. The preset
hides named orchestration and delivery skills, while other domain skills
remain discoverable. It does not change models, tools, approvals, or sandbox
permissions, and is not a security boundary.

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

## 7. Materialize and link model-aware skills

### Codex and Claude Code

From `REPO`, use the repository's installer after the prerequisites above:

```sh
./install-skills --harness codex --model astra
./install-skills --harness codex --model gpt-5.6
./install-skills --harness claude --model fable
./install-skills --harness claude --model opus
```

Run the one command matching the requested installation. Full model IDs work
too. `--dry-run --json` previews coverage and link changes without writing;
`--require-exact` requires an exact variant for every skill. The command
materializes the view, installs stable per-skill links, and retires only obsolete
links owned by that view. It refuses local-file or foreign-link collisions
before changing installed prompts. It does not edit model settings, global
instructions, personal agents, authentication, or third-party skills.

Defaults are `CODEX_HOME` or `~/.codex` for Codex, and `CLAUDE_CONFIG_DIR` or
`~/.claude` for Claude. Override with `--root ABSOLUTE_CONFIG_DIRECTORY`; this is
the harness configuration root, not its `skills/` subdirectory. To use separate
roots concurrently, configure and launch each harness with its matching
`CODEX_HOME` or `CLAUDE_CONFIG_DIR`. The installer does not copy credentials or
create an authenticated harness configuration.

Re-run with another model to switch that installation. Sessions using one root
share its files, and prompts already loaded remain in conversation history.
Start a fresh session for a clean switch. There is no automatic model-switch
hook. Re-run after every repository update, even if the model is unchanged.

Fallback notices are deduplicated when `--session ID`, `CODEX_THREAD_ID`, or
`CLAUDE_SESSION_ID` identifies the session. Without a session identifier, each
invocation reports its own fallback; show the user at most once in the current
conversation. To transfer a generated view from another clone, inspect its
`.skill-variant-view.json`, verify the old `sourceRoot`, then pass
`--previous-source OLD_REPO/skills`. Never use that flag to claim an unrelated
directory.

For Claude Code, remove older `SessionStart`, `PostModelSwitch`, or
`PreToolUse` handlers whose command invokes
`materialize-skill-variants.mjs` for this skill collection. They belong to the
retired automatic loader. Preserve unrelated handlers. Continue at step 8;
the manual procedure below is for other link-based harnesses.

### opencode and Pi

For opencode or Pi, keep the target skills directory real
and retain one per-skill symlink. Point those links at a generated view, not at
`REPO/skills` directly. Copy shared references beside the selected prompt so
their backlinks stay inside that model's view. Executable resources remain
linked to the repo so their dependencies resolve.

Choose a view outside the target skills directory:

| Harness | View root |
| --- | --- |
| opencode | `~/.config/opencode/.skill-variants/jesse-merhi-skills` |
| Pi | `~/.pi/agent/.skill-variants/jesse-merhi-skills` |

Build a static view containing the active model's copied `SKILL.md`. Shared
executable resources remain linked to their repository dependency root:

```sh
node REPO/skills/model-writing-guides/scripts/materialize-skill-variants.mjs \
  --source REPO/skills \
  --output VIEW_ROOT \
  --model 'INSTALL_MODEL_ID' \
  --format json
```

`INSTALL_MODEL_ID` is the model identifier resolved in step 1.

Read the JSON result. If `notice` is present and no earlier model-profile
notice appeared in this installation task, show it once and continue. The
materializer refuses to replace an unmarked directory or a view owned by
another repository clone. If this repository moved, read the view's
`.skill-variant-view.json`, verify that `sourceRoot` is the previous clone, and
authorize that exact ownership transfer with `--previous-source OLD_REPO/skills`.

A static view serves one active model profile. Before starting a session with a
different supported model, rerun this command with that model's full configured
ID. Do not run concurrent different-model sessions against the same static
view; configure separate harness roots and view roots when that is required. A
static view does not detect later model changes. Rerun the materializer after
every pull or other update to this repository before starting the next session,
even when the selected model is unchanged; copied `SKILL.md` files and linked
resources must come from the same repository revision.

Then:

1. Create the target skills directory if it does not exist.
2. If the target skills directory is a symlink, stop and ask unless it points at
   an old whole-directory install of this repo.
3. Re-scan the target directory after publishing the view. Remove a dead
   symlink only when its stored target is under this exact `VIEW_ROOT`, the
   current `REPO/skills`, or an `OLD_REPO/skills` root explicitly verified
   during ownership transfer. This retires repo-owned skills removed or renamed
   during publication, such as `writing-great-skills` becoming
   `writing-for-agents`, without touching real directories or unrelated links.
4. Discover each immediate skill directory under `VIEW_ROOT`. Read its
   `SKILL.md` frontmatter and stop if two entries have the same `name`.
5. Link `<target>/<name>` to `VIEW_ROOT/<name>`.
   - Replace a link to this repo or this repo's previous generated view.
   - Leave an identical link unchanged.
   - Ask before replacing a real directory with user-authored changes or a
     symlink owned elsewhere.

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
Remove the exact current `REPO/skills` entry and an explicitly verified previous
repo skills root from `skills.load.extraDirs`; those are legacy installs of this
collection and would duplicate every skill. Preserve every unrelated entry,
append the absolute view path once, remove exact duplicates, and write the
complete JSON array back with `--strict-json`. For example, when the remaining
array is empty:

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
- retired Claude Code model-routing hooks removed, absent, or skipped
- existing local skills preserved
- third-party installs run or skipped
- repo runtime dependencies installed
- repo-owned CLIs verified
- test result
