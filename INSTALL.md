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

## 3. Configure Claude orchestration

For Claude Code, this repo owns two user-level agents under
`REPO/claude/agents/`:

- `fable-orchestrator` is the default main agent, retaining its existing name
  but inheriting the selected Claude model rather than pinning Fable;
- `codex-reviewer` relays code-centric review to GPT-5.6 Sol High.

Survey `~/.claude/agents/` before changing it. Link each repo agent by filename
into that real directory. Replace a matching repo symlink or a dead symlink,
but ask before replacing a real file or a symlink owned elsewhere. Preserve all
unrelated agents.

Retire the deleted `opus-worker.md` only when it is a symlink whose stored
target is `REPO/claude/agents/opus-worker.md`, or a previous clone's matching
path that you have verified belongs to this repository. Preserve a real file
or any link owned elsewhere.

Set `agent` to `fable-orchestrator` in `~/.claude/settings.json`, preserving
every other setting. If `agent` already names something else, ask before
replacing it. Then validate the agent directory:

```sh
claude plugin validate ~/.claude/agents
```

The default main agent takes effect in the next Claude Code session. Preserve
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

The preset also sets `memories.use_memories`, `memories.generate_memories`, and
`memories.dedicated_tools` to false, and hides `session-recall`. This prevents
automatic memory injection/generation for these reviewer sessions; it does not
restrict filesystem reads. Always launch a fresh reviewer rather than resume
the implementer's context. App subagent tools that cannot select a profile do
not inherit these controls merely because the file is installed.

The memory controls were exercised with Codex 0.153.1 against a loopback-only
fixture provider: the normal configuration injected a temporary memory marker,
while the reviewer profile omitted it and retained the reviewer instructions.
No real model or user memory was used. `debug prompt-input` alone does not
exercise the memory extension and is not proof of isolation.

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
node REPO/skills/writing-for-agents/scripts/materialize-skill-variants.mjs \
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

### Command installation

The Codex/Claude installer in step 7 also publishes the explicit public-command
catalog from `skills/writing-for-agents/scripts/install-commands.mjs` to
`~/.local/bin`. It does not scan executable files or publish tests and internal
libraries. No shell configuration is changed. If that directory is not on
`PATH`, the installer reports it; choose an existing PATH directory with
`--bin-dir` or update your environment yourself.

`--root` changes only the harness configuration root. For a completely isolated
installation, supply both directories:

```sh
./install-skills --harness codex --model astra \
  --root /temporary/codex --bin-dir /temporary/bin --dry-run --json
```

JSON output includes `binDir`, the complete resulting `commands` catalog
(`name`, owning `skill`, absolute `target`, and `runtime`), `commandsChanged`,
and `commandsRetired`. A dry run checks collisions and entrypoints without
writing files. Install from a durable repository clone with its dependencies
installed, not a disposable worktree: launchers execute that clone's absolute
entrypoints, preserving arguments, working directory, environment and exit
status. They do not run from a generated model view.

Both harnesses share one owner at
`BIN_DIR/.jesse-merhi-skills-commands/manifest.json`. Matching installs are
idempotent and use a shared publication lock. A different clone cannot take
ownership unless a full install explicitly supplies the verified
`--previous-source OLD_REPO/skills`. After a transfer, old-clone installs are
refused rather than silently switching commands back.

Existing unmanaged binaries, directories and foreign or unowned symlinks are
never overwritten, including dead links. A collision stops installation before
prompts change; inspect it and resolve ownership separately. Modified managed
launchers also stop installation. Full installs retire only obsolete aliases
still pointing at this command owner, preserving foreign replacements.
`--skill NAME` updates that skill's aliases while preserving unselected aliases;
it retains the existing requirement for the same installed model and source.
Command or prompt publication failures restore changed aliases and the previous
command catalog. The standalone materializer does not publish PATH commands.

Public aliases:

| Commands | Owning skill / entrypoint |
| --- | --- |
| `codex-review`, `review-findings` | `code-review/scripts/<name>`; `codex-review` dispatches native reviews only |
| `ask-codex`, `ask-claude` | Respective skill's `scripts/<name>` |
| `rovodev-atlassian` | `atlassian-queries/scripts/rovodev-atlassian` |
| `skill-cleaner` | `skill-cleaner/scripts/skill-cleaner` |
| `skill-audit-layout` | `frontend-ui-validation/scripts/audit-layout.mjs` |
| `skill-cleanup-inventory` | `cleanup/scripts/inventory.mjs` |
| `skill-collect-context` | `grill-with-docs/scripts/collect-context.mjs` |
| `skill-diff-page` | `html-explanations/scripts/diff-page.mjs` |
| `skill-render-diagram`, `skill-check-rendered-diagram` | `design-technical-diagrams/scripts/render-diagram.mjs`, `check-rendered-diagram.mjs` |
| `codex-handoff-tmux`, `detect-handoff-surface` | `handoff/scripts/<name>` |
| `quiet-wait`, `estimate-gh-wait` | `wait-efficiently/scripts/<name>` |
| `pr-net-diff`, `github-verify-rendered-proof`, `proof-media` | `pr-proof-pack/scripts/<name>` |
| `proof-publication` | `pr-proof-pack/scripts/proof-publication.mjs` |
| `clawhub-local-test`, `openclaw-stg-test` | `openclaw/<name>/scripts/<name>` |

### Verify commands

After an authorized installation, verify the PATH aliases rather than resolving
a skill directory. `review-findings` uses the repo-owned Effect runtime
installed in step 5 and reports its SQLite database path:

```sh
command -v codex-review review-findings skill-cleaner
codex-review --help
review-findings path
```

Retire any `AGENT_REVIEW_FINDINGS_BIN` export from harness configuration.
That override belonged to the removed Rust installation and can silently select
a CLI that lacks the required scope commands. The installed alias calls the
current repo-owned launcher.

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
