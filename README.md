# Skills

![Abstract banner for a repository of agent skills](assets/skills-banner.png)

This repo is my working set of agent skills: 43 Markdown workflows that coding
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
agent*, not to you. It detects the harness, links the global instruction
files, surveys what is already in your skills directory, symlinks each repo
skill in by its frontmatter `name`, reconciles third-party skills from
[`external.md`](external.md), and runs the tests. It asks before touching
anything it did not put there.

Where the skills land, per harness:

| Harness | Skills directory | Global instructions |
| --- | --- | --- |
| Claude Code | `~/.claude/skills` | `~/.claude/CLAUDE.md` + `~/.claude/AGENTS.md` |
| Codex CLI | `~/.codex/skills` | `~/.codex/AGENTS.md` |
| opencode | `~/.config/opencode/skills` | `~/.config/opencode/AGENTS.md` |
| Pi | `~/.pi/agent/skills` | not linked |
| OpenClaw | `REPO/skills` via `skills.load.extraDirs` | not linked |

The install model is deliberately boring. In the four link-based harnesses,
your skills directory stays a real directory and every repo skill is one
symlink inside it. OpenClaw watches `REPO/skills` directly instead. So you can
pull, diff, and update this repo like any other, and nothing turns into a
mystery tree. Hand-written local skills are never replaced without asking.

**Honesty about harness coverage:** the installer handles four link-based
harnesses plus a locally running OpenClaw Gateway. The skills themselves were
written and exercised almost entirely on Codex and Claude Code, and several
name those harnesses directly. `code-review` picks between `codex review` and
Claude Code's built-in review, `session-recall` indexes Codex and Claude session
logs, `acpx-frontend-delegation` drives Claude Code from Codex. On opencode, Pi,
and OpenClaw they will install; whether every one of them *works* is not
something this repo proves.

## What a skill actually is

A skill is a directory with a `SKILL.md` inside it. The frontmatter carries a
`name` and a one-line `description`; the body is the workflow: steps, rules,
stop conditions, and pointers to reference files that only get read when they
are needed.

Two ways one gets used:

- **The agent picks it.** Harnesses keep every skill's `name` and
  `description` in context and load the body when the description matches the
  task. That is why the descriptions in this repo are written as trigger
  conditions rather than summaries.
- **You name it.** `$skill-name` in Codex, `/skill-name` in Claude Code, or just
  "use `grilling` on this" in either harness. Codex marks eight skills as
  explicit-only: `code-review`, `html-explanations`, `pr-review-checkout`,
  `prototype`, `to-spec`, `to-tickets`, `wayfinder`, and
  `clawsweeper-until-clean`. They can review and fix code, operate desktop UI,
  write durable planning files, or run a long external loop, so Codex waits for
  you to name them.

Some skills are not entry points at all. `review-guardrails`,
`finding-discipline`, and `review-flow-map` are plumbing that the review
loops load; you can invoke them directly, but usually something else does.

## The loop

The skills are not a menu. They snap into the loop I actually run:

1. **Find the thing.** `session-recall` for context I already had,
   `review-flow-map` for a change I need to understand, `diagnose` for a bug
   that is still vague.
2. **Brief it.** `grill-with-docs` pulls repo docs, code, and Obsidian notes in
   before the agent starts guessing. `research` when the answer lives in
   primary sources outside the repo.
3. **Make it grill me.** `grilling` until the undecided decisions are on the
   table with recommendations attached.
4. **Freeze the plan.** `to-spec` writes the spec and the intended PR shape.
   `to-tickets` when it needs to become blocker-aware slices. `wayfinder` when
   the work is too foggy to fit in one session at all.
5. **Hand off and let it run.** `handoff` for a clean fresh thread,
   `parallel-slice-orchestration` when several isolated worktrees should move at
   once, external `gh-stack` when one story is really a dependency-ordered
   stack.
6. **Prove it.** `test-audit`, `frontend-ui-validation`, `diagnose`, because
   the transcript is not evidence.
7. **Review it like I hate it.** `code-review` runs the native engine until
   clean, then an independent cold reviewer until clean. `pr-rubbish-audit`
   catches what the diff smuggled in.
8. **Ship it.** `pr-proof-pack` for reviewer-visible evidence,
   `monitoring-gh-actions` for CI.
9. **Clean the loop itself.** `skill-cleaner` when the skills start costing more
   than they return.

A worked example, three skills deep: `code-review` is a thin orchestrator. It
runs `review-until-clean`, which loops the harness's *own* review command
until two consecutive passes come back clean. Then it runs
`cold-pr-review-until-clean`, which spawns a fresh subagent per pass with zero
implementation context: no rationale, no prior findings, no CI status. Knowing
why a decision was made stops you asking whether it was right. Under both,
`finding-discipline` throws out nits and vague risks, and `review-guardrails`
caps how far review-driven fixes may grow the PR before it has to come back and
ask me.

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
| [`code-review`](skills/code-review/SKILL.md) | Entry point: runs the native until-clean phase, then the cold until-clean phase, on one frozen target. |
| [`review-until-clean`](skills/review-until-clean/SKILL.md) | Loops the harness-native review (`codex review`, Claude Code's built-in) and fixes findings until two consecutive passes are clean. |
| [`cold-pr-review`](skills/cold-pr-review/SKILL.md) | One independent review pass by a subagent given only the target and a neutral checklist, so it cannot inherit the author's anchoring. |
| [`cold-pr-review-until-clean`](skills/cold-pr-review-until-clean/SKILL.md) | Repeats fresh cold reviews and fixes until one full pass returns zero actionable findings. |
| [`pr-rubbish-audit`](skills/pr-rubbish-audit/SKILL.md) | Hunts the diff for things the feature never asked for: stray refactors, dead comments, generated drift, unrelated deletions. |
| [`pr-proof-pack`](skills/pr-proof-pack/SKILL.md) | Checks and refreshes reviewer-visible proof when a PR is being published or prepared for merge, never on local commits. |
| [`pr-review-checkout`](skills/pr-review-checkout/SKILL.md) | Opens a PR in its real worktree and reviews it through VS Code, with an answer-first orientation for a cold reader. |
| [`monitoring-gh-actions`](skills/monitoring-gh-actions/SKILL.md) | Waits on GitHub Actions with history-derived intervals and reports state changes, instead of polling or triaging. |

Internal review plumbing, loaded by the loops above and rarely called directly:

| Skill | What it does |
| --- | --- |
| [`review-guardrails`](skills/review-guardrails/SKILL.md) | Bounds an autonomous review: scope baseline, budgets, consult queue, provisional fixes, and the fixed point where it must stop and ask. |
| [`finding-discipline`](skills/finding-discipline/SKILL.md) | Requires a concrete failure or a present cost before a finding counts, and merges duplicates into one root cause. |
| [`review-flow-map`](skills/review-flow-map/SKILL.md) | Traces the changed runtime flows, contracts, and side effects before anyone is allowed to write a finding. |

### Code quality and correctness

| Skill | What it does |
| --- | --- |
| [`diagnose`](skills/diagnose/SKILL.md) | Makes a bug reproducible before touching production code, then fixes the smallest proven cause. |
| [`test-audit`](skills/test-audit/SKILL.md) | Audits a test suite for real gaps, stale assertions, brittle mocks, impossible states, and tests worth deleting. |
| [`tdd`](skills/tdd/SKILL.md) | The red-green-refactor loop and the rules that make the tests worth keeping; loaded by orchestration workflows more than called directly. |
| [`typescript-discipline`](skills/typescript-discipline/SKILL.md) | Shared types, validation at boundaries, safe narrowing, no `as any`. |
| [`reducing-cognitive-load`](skills/reducing-cognitive-load/SKILL.md) | Reviews code that is clever, stringly typed, or over-abstracted and makes it readable. |
| [`improve-codebase-architecture`](skills/improve-codebase-architecture/SKILL.md) | An architectural lens over module depth, interfaces, locality, and testability. Proposes the smallest structural change, not a refactor. |

### Planning, context, and handoff

| Skill | What it does |
| --- | --- |
| [`grilling`](skills/grilling/SKILL.md) | Interviews you as a design tree, one full round of questions at a time, each with a recommended answer. |
| [`grill-with-docs`](skills/grill-with-docs/SKILL.md) | Same, but grounded first in repo docs, code, ADRs, specs, and tickets. |
| [`research`](skills/research/SKILL.md) | Answers a question from primary sources such as official docs, source, and specs, with citations rather than blog posts. |
| [`to-spec`](skills/to-spec/SKILL.md) | Turns a settled conversation into an Obsidian spec including testing seams and the intended PR delivery shape. |
| [`to-tickets`](skills/to-tickets/SKILL.md) | Splits a plan into tracer-bullet Obsidian tickets with explicit blocking edges and logical PR groups. |
| [`wayfinder`](skills/wayfinder/SKILL.md) | For work too foggy for one session: charts it as decision tickets in Obsidian and resolves them until the route is visible. |
| [`session-recall`](skills/session-recall/SKILL.md) | Finds the earlier local Codex or Claude session that already answered this, without dumping transcripts into context. |
| [`handoff`](skills/handoff/SKILL.md) | Compacts the current conversation into a handoff document a fresh agent can start from. |
| [`parallel-slice-orchestration`](skills/parallel-slice-orchestration/SKILL.md) | Implements a spec across parallel agents with disjoint file ownership, then integrates and verifies. |

### Frontend and design

| Skill | What it does |
| --- | --- |
| [`frontend-design`](skills/frontend-design/SKILL.md) | Layout, hierarchy, typography, colour, and every state of the screen, implemented rather than sketched. |
| [`design-engineering`](skills/design-engineering/SKILL.md) | Owns the interaction layer: transitions, gestures, springs, easing, and how it feels under the finger. |
| [`review-animations`](skills/review-animations/SKILL.md) | Reviews existing motion code for purpose, timing, interruption, performance, and reduced-motion support. |
| [`prototype`](skills/prototype/SKILL.md) | Builds 3–5 genuinely divergent UI variants behind a picker, isolated from production. Explicit request only. |
| [`frontend-ui-validation`](skills/frontend-ui-validation/SKILL.md) | The visual gate: Playwright screenshots, overflow and clipping checks, responsive states, console errors. |
| [`acpx-frontend-delegation`](skills/acpx-frontend-delegation/SKILL.md) | Lets Codex borrow Claude Code as a frontend specialist through `acpx` while keeping scope and validation. |

### Communication

| Skill | What it does |
| --- | --- |
| [`speak-fking-english`](skills/speak-fking-english/SKILL.md) | Runs a compact clarity and voice pass before every final response, then adds the full AI-tells catalogue when the user invokes the skill explicitly. |
| [`html-explanations`](skills/html-explanations/SKILL.md) | Builds a standalone HTML page when prose would be a wall of text: code flow, tradeoffs, diagrams, small interactive demos. Opt-in only. |

### Meta and operations

| Skill | What it does |
| --- | --- |
| [`writing-for-agents`](skills/writing-for-agents/SKILL.md) | How to write skills, `AGENTS.md`, and `CLAUDE.md` so the instruction actually changes behaviour. Read this before adding a skill. |
| [`skill-cleaner`](skills/skill-cleaner/SKILL.md) | Audits installed skill roots for duplicates, unused skills, and prompt-budget pressure, with safety checks before deleting. |
| [`wait-efficiently`](skills/wait-efficiently/SKILL.md) | Waits on commands, CI, and subagents through native event-driven mechanisms instead of burning tokens on heartbeats. |
| [`atlassian-cloudid-jira`](skills/atlassian-cloudid-jira/SKILL.md) | Queries Jira, JPD, and Confluence through the local Rovo Dev gateway, always naming the site explicitly. |

### OpenClaw and ClawHub

Project-specific skills, grouped under [`skills/openclaw/`](skills/openclaw) so
the rest of the repo stays legible. They still install by name like everything
else. They will only be useful to you if you work on those projects.

| Skill | What it does |
| --- | --- |
| [`openclaw-local-test`](skills/openclaw/openclaw-local-test/SKILL.md) | Brings up an isolated local OpenClaw Gateway for manual browser testing using the current Codex or Claude login. |
| [`openclaw-stg-test`](skills/openclaw/openclaw-stg-test/SKILL.md) | Publishes a temporary Control UI preview through a guarded Cloudflare Quick Tunnel without exposing an authenticated Gateway. |
| [`openclaw-telegram-handoff`](skills/openclaw/openclaw-telegram-handoff/SKILL.md) | Sends one terminal update to an approved Telegram route when work is done or blocked, and relays the reply back to the source session. |
| [`clawhub-local-test`](skills/openclaw/clawhub-local-test/SKILL.md) | Runs a local ClawHub instance against a development Convex deployment seeded from a production snapshot, never production itself. |
| [`clawsweeper-until-clean`](skills/openclaw/clawsweeper-until-clean/SKILL.md) | Loops the Clawsweeper PR bot through trigger, wait, fix, and push until three consecutive re-reviews come back clean. |

## External skills

Some workflows are better owned by whoever maintains them.
[`external.md`](external.md) pins those to a reviewed version and records the
install command per harness; the installer runs them, and this repo never
copies or symlinks their files.

| Skill | Owner | Harnesses with a tested command |
| --- | --- | --- |
| `browser-use` | Browser Use | Claude Code |
| `gh-stack` | GitHub | Claude Code, Codex, opencode, Pi |
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
TypeScript helpers. `bun run validate:effect` is lint, typecheck, Effect
diagnostics, and Vitest. CI runs the same set.

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
- One skill per directory, `SKILL.md` at its root, `name` unique across the
  repo. Keep the body short and push detail into `references/`.
- Run the three commands above before opening a PR.
- Third-party workflows go in [`external.md`](external.md) as a pinned install
  command, not as copied files.

## Credits

Some of this started somewhere else.

Matt Pocock's agent workflow ideas shaped the grilling, spec, slicing, and
handoff parts of the loop, and `tdd` adapts his skill directly. Emil Kowalski's
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
