# Skills

![Abstract banner for a repository of agent skills](assets/skills-banner.png)

This repo is my working set of agent skills: Markdown workflows that coding
agents load on demand, plus the global instruction files ([`AGENTS.md`](AGENTS.md),
[`CLAUDE.md`](CLAUDE.md)) and a few helper scripts they lean on.

It exists because of a rule I keep rediscovering. Asking an agent to do
something once is fine. Twice is laziness. The third time, one of three things
is true: it should be a skill, it should be a script, or the workflow itself is
wrong. This repo is mostly the first two.

Treat it like a dotfiles repo, not a framework. The details reflect how I like
to build, review, and ship, and a lot of them name my tools by name. The shape
underneath is what generalises: give the agent real context, make the work
legible, hand off the parts that can run alone, and stand at the end of the loop
as the bar nothing ships past until it is actually good.

AI did not delete software engineering. It moved most of the typing somewhere
else and made the review problem much sharper. These are the rails I use to stay
on the right side of that.

## Quick start

For a local, disk-backed skill-editing workspace, run `bun run review:skills`.
The [skill review guide](packages/skill-review/README.md) explains drafts,
original snapshots, revision history, backups, and applying reviewed changes.

**Prerequisites:** Node 24+, Bun (the exact version is pinned in
[`package.json`](package.json)), and `git`.

```sh
git clone git@github.com:jesse-merhi/skills.git ~/repos/skills
cd ~/repos/skills
bun ci
```

Then start your agent inside that directory and hand it the installer:

```text
Read INSTALL.md and install these skills for your harness.
```

[`INSTALL.md`](INSTALL.md) is the authoritative installer and is written *to the
agent*, not to you. It detects the harness and active model, builds a lightweight
view that delivers one complete model-specific prompt per invocation, links
those skills by frontmatter `name`, reconciles third-party skills from
[`external.md`](external.md), and runs the tests. It asks before touching
anything it did not put there.

To install or switch just this repo's skills, run one command from the clone:

```sh
./install-skills --harness codex --model astra
./install-skills --harness codex --model gpt-5.6
./install-skills --harness claude --model fable
./install-skills --harness claude --model opus
```

Each command installs this repo's available skills for that model. Add `--require-exact` to
reject missing model coverage, or `--dry-run` to inspect without writing.
The command preserves other skills and harness settings; it does not select
the model for you. Start a fresh session for a clean prompt switch. Use separate
`--root` harness configuration directories for concurrent different-model
sessions; sessions sharing a root share its installed skills.

For a targeted update, add `--skill <name>` (repeatable). This preserves other
installed prompts and requires the existing model and source to match. Use a
full installation to switch models or transfer source ownership.

Where the skills land, per harness:

| Harness | Skills directory | Global instructions | Personal agents |
| --- | --- | --- | --- |
| Claude Code | `~/.claude/skills` | `~/.claude/CLAUDE.md` + `~/.claude/AGENTS.md` | Claude orchestrator, Codex reviewer |
| Codex CLI | `~/.codex/skills` | `~/.codex/AGENTS.md` | not linked |
| opencode | `~/.config/opencode/skills` | `~/.config/opencode/AGENTS.md` | not linked |
| Pi | `~/.pi/agent/skills` | not linked | not linked |
| OpenClaw | generated model view via `skills.load.extraDirs` | not linked | not linked |

The install model is deliberately boring. In the four link-based harnesses,
your skills directory stays a real directory and every repo skill is one
symlink into a generated view. Codex, opencode, Pi, and OpenClaw receive a
contained static copy of the selected prompt, as does Claude. Shared executable
resources stay linked to this repo so their dependencies resolve. The command
refuses to replace hand-written local skills or links owned elsewhere.

Claude Code starts with the repo-owned `fable-orchestrator` as its main agent.
The existing agent name is unchanged, but it now inherits your selected Claude
model instead of forcing Fable. It owns implementation and high-level review,
and delegates code-centric review to GPT-5.6 Sol High.

Codex has an opt-in `findings-reviewer` CLI profile for inspect-and-report
sessions. After installation, use `codex --profile findings-reviewer review
--base main`, or the normal `skills/code-review/scripts/codex-review` helper,
which selects the preset automatically when its file is installed in
`CODEX_HOME` (default `~/.codex`). Without that file the helper keeps native
review's normal configuration; `--dry-run` shows the selected command. It hides
a short list of coordination, publication, and handoff
skills by name, while keeping domain skills discoverable on demand.
Reviewers return candidates; coordinators apply code-review's triage instructions. Coordinators and delegated until-clean
workflows keep their normal profile; in-chat spawn tools without profile
selection are not filtered. This is a relevance filter, not a permission
boundary, and it does not override the selected model or sandbox.

**Honesty about harness coverage:** the installer handles four link-based
harnesses plus a locally running OpenClaw Gateway. The skills themselves were
written and exercised almost entirely on Codex and Claude Code, and several
name those harnesses directly. `code-review` picks between `codex review` and
Claude Code's built-in review, `session-recall` indexes Codex and Claude session
logs, and `ask-claude` / `ask-codex` open cross-harness ACP sessions. On opencode, Pi,
and OpenClaw they will install; whether every one of them *works* is not
something this repo proves.

## What a skill actually is

The [original skill prompts](originals/README.md) are kept verbatim in `originals/`
with their source commits. They are reference copies, separate from the maintained
model variants, and are never included in model-specific installations.

A skill is a directory with complete prompts under `variants/`. Its root
`SKILL.md` points at the GPT-5.6 variant so ordinary repository discovery still
works. Installation selects one variant as the harness-visible `SKILL.md`; the
frontmatter carries a `name` and one-line `description`, and the body contains
the workflow, constraints, stop conditions, and reference pointers.

Two ways one gets used:

- **The agent picks it.** Harnesses keep every skill's `name` and
  `description` in context and load the body when the description matches the
  task. That is why the descriptions in this repo are written as trigger
  conditions rather than summaries.
- **You name it.** `$skill-name` in Codex, `/skill-name` in Claude Code, or just
  "use `grilling` on this" in either harness. Codex marks five skills as
  explicit-only: `code-review`, `html-explanations`,
  `just-do-it`, `to-spec`, and `to-tickets`. They can review and fix code, operate desktop UI,
  write durable planning files, or run a long external loop, so Codex waits for
  you to name them.

Triage, blocked checks and pass recording are references inside `code-review`, linked where the workflow uses them. They are not separate skills.

Model-writing guidance and installer scripts live under `writing-for-agents`;
the diff-rubbish lens lives under `code-review`. Neither is a separate skill.

Every skill has full GPT-5.6, GPT-6 Astra, Claude Fable 5.1, and Claude Opus 5
variants. Selection
happens locally before the model sees the workflow, so there is no router turn
or unused prompt in context. Harness views expose the selected prompt directly.
A newer model in a supported family falls back to the newest family variant and
produces one update notice during materialization.

## The loop

The skills are not a menu. They snap into the loop I actually run:

1. **Find the thing.** `session-recall` for context I already had,
   code-review's flow-map reference for a change I need to understand.
2. **Brief it.** `grill-with-docs` pulls repo docs, code, and Obsidian notes in
   before the agent starts guessing. Use primary sources for questions outside the repo.
3. **Make it grill me.** `grilling` until the undecided decisions are on the
   table with recommendations attached.
4. **Freeze the plan.** `to-spec` writes the spec and the intended PR shape.
   `to-tickets` when it needs to become blocker-aware slices.
5. **Hand off and let it run.** `handoff` for a clean fresh thread,
   `just-do-it` to finish a proposed change, the installed `gh stack` tool when one story needs a dependency-ordered
   stack; discover commands through `gh stack --help`.
6. **Prove it.** `writing-good-tests` for useful test proof and `frontend-ui-validation`, because
   the transcript is not evidence.
7. **Review it like I hate it.** `code-review` runs the native engine until
   clean, then an independent cold reviewer until clean. the diff-rubbish lens
   catches what the diff smuggled in.
8. **Ship it.** `pr-proof-pack` for reviewer-visible evidence and
   `wait-efficiently` for CI.
9. **Clean the loop itself.** `skill-cleaner` when the skills start costing more
   than they return.

A worked example: `code-review` runs native review until two passes are clean, then an independent review with a fresh reviewer. After each result, check the findings, record them through the CLI, fix worthwhile problems and repeat. The CLI derives ratings and checks saved limits. Finish with the relevant tests, an authorized push, and a summary of findings and code changes. Independent review defaults to one clean pass; the separately requested ClawSweeper path still requires two.

None of this is sacred. Half the specific commands here will be obsolete soon
enough. The shape is the point.

## Catalogue

Every skill in the repo, once each.

### Review and PR delivery

The distinction that matters: **native** reviews run the harness's own review
engine, **cold** reviews run an independent subagent that was never told why the
code looks the way it does.

| Skill | What it does |
| --- | --- |
| [`just-do-it`](skills/just-do-it/SKILL.md) | Delivers one well-defined change through review, proof, and CI; also runs ClawSweeper for `openclaw/openclaw` PRs. |
| [`code-review`](skills/code-review/SKILL.md) | Entry point: runs the native until-clean phase, then the cold until-clean phase, on one frozen target. |
| [`pr-proof-pack`](skills/pr-proof-pack/SKILL.md) | Checks and refreshes reviewer-visible proof when a PR is being published or prepared for merge, never on local commits. |

Cold-review dispatch and its neutral checklist live in [code-review's internal brief](skills/code-review/references/cold-review.md); they are not a separate skill.

Triage and blocked-check handling are now references in `code-review`; the former standalone skills are retired.

### Code quality and correctness

| Skill | What it does |
| --- | --- |
| [`writing-good-tests`](skills/writing-good-tests/SKILL.md) | Plans and audits useful test coverage, then implements missing behavior through test-first cycles; review-only work stays read-only. |
| [`typescript-discipline`](skills/typescript-discipline/SKILL.md) | Shared types, validation at boundaries, safe narrowing, no `as any`. |
| [`reducing-cognitive-load`](skills/reducing-cognitive-load/SKILL.md) | Reviews code that is clever, stringly typed, or over-abstracted and makes it readable. |

### Planning, context, and handoff

| Skill | What it does |
| --- | --- |
| [`grilling`](skills/grilling/SKILL.md) | Interviews you as a design tree, one full round of questions at a time, each with a recommended answer. |
| [`grill-with-docs`](skills/grill-with-docs/SKILL.md) | Same, but grounded first in repo docs, code, ADRs, specs, and tickets. |
| [`to-spec`](skills/to-spec/SKILL.md) | Turns a settled conversation into an Obsidian spec including testing seams and the intended PR delivery shape. |
| [`to-tickets`](skills/to-tickets/SKILL.md) | Splits a plan into tracer-bullet Obsidian tickets with explicit blocking edges and logical PR groups. |
| [`session-recall`](skills/session-recall/SKILL.md) | Finds the earlier local Codex or Claude session that already answered this, without dumping transcripts into context. |
| [`handoff`](skills/handoff/SKILL.md) | Compacts the current conversation into a handoff document a fresh agent can start from. |
| [`feedback-hardening`](skills/feedback-hardening/SKILL.md) | Turns evidence-backed user corrections or self-detected mistakes revealing reusable agent failures into one independent systemic-fix recommendation, waits for approval, then implements the selected repair. |

### Frontend and design

| Skill | What it does |
| --- | --- |
| [`design`](skills/design/SKILL.md) | The single visible design router; it loads internal production-UI, interaction, motion-review, or explicit-prototype guidance as needed. |
| [`design-technical-diagrams`](skills/design-technical-diagrams/SKILL.md) | Builds and visually validates architecture, lifecycle, sequence, trust-boundary, and decision diagrams. |
| [`frontend-ui-validation`](skills/frontend-ui-validation/SKILL.md) | The visual gate: Playwright screenshots, overflow and clipping checks, responsive states, console errors. |
| [`ask-claude`](skills/ask-claude/SKILL.md) | Opens a fresh full Claude session through ACP for independent advice or scoped implementation. |
| [`ask-codex`](skills/ask-codex/SKILL.md) | Opens a fresh full Codex session through ACP from another harness. |

### Communication

| Skill | What it does |
| --- | --- |
| [`speak-fking-english`](skills/speak-fking-english/SKILL.md) | Makes replies concise and easy to understand. |
| [`de-slop`](skills/de-slop/SKILL.md) | Rewrites prose to remove AI-like padding while preserving its meaning and voice. |
| [`html-explanations`](skills/html-explanations/SKILL.md) | Builds a standalone HTML page when prose would be a wall of text: code flow, tradeoffs, diagrams, small interactive demos. Opt-in only. |

### Meta and operations

| Skill | What it does |
| --- | --- |
| [`writing-for-agents`](skills/writing-for-agents/SKILL.md) | How to write skills, `AGENTS.md`, and `CLAUDE.md` so the instruction actually changes behaviour. Read this before adding a skill. |
| [`skill-cleaner`](skills/skill-cleaner/SKILL.md) | Audits installed skill roots for duplicates, unused skills, and prompt-budget pressure, with safety checks before deleting. |
| [`cleanup`](skills/cleanup/SKILL.md) | Discovers and removes the complete local footprint of finished or abandoned work while preserving saved work and shared infrastructure. |
| [`wait-efficiently`](skills/wait-efficiently/SKILL.md) | Waits on commands, CI, and subagents through native event-driven mechanisms instead of burning tokens on heartbeats. |
| [`atlassian-queries`](skills/atlassian-queries/SKILL.md) | Queries Jira, JPD, and Confluence through the local Rovo Dev gateway, always naming the site explicitly. |

### OpenClaw and ClawHub

Project-specific skills, grouped under [`skills/openclaw/`](skills/openclaw) so
the rest of the repo stays legible. They still install by name like everything
else. They will only be useful to you if you work on those projects.

| Skill | What it does |
| --- | --- |
| [`openclaw-stg-test`](skills/openclaw/openclaw-stg-test/SKILL.md) | Publishes a temporary Control UI preview through a guarded Cloudflare Quick Tunnel without exposing an authenticated Gateway. |
| [`clawhub-local-test`](skills/openclaw/clawhub-local-test/SKILL.md) | Runs a local ClawHub instance against a development Convex deployment seeded from a production snapshot, never production itself. |

## External skills

The ownership model is explicit: repo-owned skills are maintained here;
repo-owned forks keep their upstream license and document intentional drift;
external skills remain installed and updated by their upstream owner. See the
ownership table and reviewed pins in [`external.md`](external.md). The installer
runs external install commands; this repo never copies or symlinks those files.

| Skill | Owner | Harnesses with a tested command |
| --- | --- | --- |
| `teach` | Matt Pocock | Codex |

`external.md` also keeps tombstones for retired third-party skills, with removal
commands that run on every reinstall. `impeccable` is there now. Removing its
directory was never enough, since its hook wrote state outside it that survived
two reinstalls.

## Verify

```sh
./tests/skills-test
./tests/review-findings-test
bun run validate:effect
```

These check skill frontmatter, the handoff tmux helper, the `review-findings`
CLI lifecycle, OpenClaw/ClawHub process behaviour, and the Effect-based
TypeScript helpers. `bun run validate:effect` is lint, the skill layout lint
(`bun run lint:skills`), typecheck, Effect diagnostics, and Vitest. CI runs the
same set.

The repo-owned Effect SQL `review-findings` CLI is worth knowing about:
[`skills/code-review/scripts/review-findings`](skills/code-review/scripts/review-findings)
backs the review loops with a local SQLite store of findings, verification
records, and scope baselines. It runs from that launcher against the repo's own
Effect runtime. There is no separate global install.

## Contributing

This is a personal repo, so I am picky about what lands in it, but issues and
PRs are welcome.

- Read [`writing-for-agents`](skills/writing-for-agents/SKILL.md) first. Skill
  descriptions are trigger conditions; if yours reads like a summary, the agent
  will not load it at the right moment.
- Give every skill a complete prompt in `variants/gpt-5.6.md`,
  `variants/gpt-6-astra.md`, `variants/claude-fable-5.1.md`, and
  `variants/claude-opus-5.md`. Preserve one
  behavior contract while following each model's official prompting guide. The
  [`writing-for-agents`](skills/writing-for-agents/SKILL.md) skill owns the
  guide links, selector, fallback order, and new-model workflow.
- One skill per directory, root `SKILL.md` linked to the GPT-5.6 variant, and
  `name` unique across the repo. Keep each complete variant short. Put anything
  every use needs inline; put conditional or advanced detail in `references/`,
  linked one hop from the variant only. A reference file must not link to
  another reference; the only file under `skills/` it may link to is its own
  root `SKILL.md`.
- `bun run lint:skills` enforces the hop and length rules, requires every
  reference to be linked from `SKILL.md`, and warns when one reference is
  linked from both a workflow step and a `Context pointers` section, so you
  can decide whether to inline it.
- Run the three commands above before opening a PR.
- Third-party workflows go in [`external.md`](external.md) as a pinned install
  command, not as copied files.

## Credits

Some of this started somewhere else.

Matt Pocock's agent workflow ideas shaped the grilling, spec, slicing, and
handoff parts of the loop, and `writing-good-tests` adapts his skill directly. Emil Kowalski's
design-engineering work shaped the interaction, motion, and prototyping skills.
Matt Pocock's `wait-what` and HumanLayer's `show-me` shaped the reader-reset and
visual-selection passes now living inside `speak-fking-english`, and Lauren
Tan's `unslop` supplied its AI-tells catalogue. Adapted material keeps its own MIT
notices. [`upstreams.json`](upstreams.json) records the source paths and exact
commits used for the latest upstream review.

I took the shape, bent it around my own setup, and kept the parts that paid
rent.

## Public snapshot

This repository was published as a clean snapshot, not a mirror of the private
workspace it grew in. That keeps the workflows public without dragging along
private history, local machine paths, credentials, or old vendor baggage. It
also means the git history here starts later than the work does.

Personal and opinionated does not mean secret. Workflow stays. Leaks do not.

## License

MIT. See [`LICENSE`](LICENSE). Adapted third-party material retains its own
notices.

## Security

If you find a secret, unsafe install behaviour, a private path that should not
be public, or a helper script that can mutate a machine without clear consent,
please use GitHub private vulnerability reporting rather than a public issue.
See [`SECURITY.md`](SECURITY.md).
