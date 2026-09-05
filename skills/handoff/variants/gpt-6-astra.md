---
name: handoff
description: 'Transfer the current work to a fresh full agent session, placing related work beside the current session and unrelated asides separately.'
---

# Handoff

For Codex destinations, resolve the model and reasoning effort using
[Codex model selection](references/session-routing.md#codex-model-selection)
before launch, and include the selected settings and verification in closeout.

Prepare and launch a full independent session that can continue from verified
state. Handoffs never use subagents, in-chat delegated workers, or background
agents, including for preparation.

## Carry the work and choose its placement

Create one compact handoff document in the OS temporary directory with objective,
current state, evidence, touched files and commands, blockers, validation,
durable Obsidian research links, suggested skills, and concrete next actions.
Link artifacts and remove secrets or unnecessary personal data.

Use `continuation` for the same objective, feature, investigation, review, or
implementation; use `aside` for a separate user-introduced objective. Resolve
direct continuation from context without reopening that choice. Independent
execution does not make related work an aside.

## Verify the route and launch

Run `scripts/detect-handoff-surface` and read
[session-routing.md](references/session-routing.md). Follow the first verified
route in this order: explicit destination, current tmux pane, current app session,
supported running app, fresh terminal or ACPX session. Use ancestry and native
session markers before global discovery; another tmux process does not establish
that the current session is in tmux.

Before launching edit, repair, commit, or PR work, read
[worktree-isolation.md](references/worktree-isolation.md), plus
[repair-pr-handoffs.md](references/repair-pr-handoffs.md) for repairs/PRs.
Designate the required worktree and include the required boundaries, skills,
and publication authority in the receiving brief.

For tmux, read [tmux-placement.md](references/tmux-placement.md): a continuation
gets a new pane in the current window, an aside a new window in the current session.
For the Codex app, create a fresh task in the same project for continuation;
use a projectless or matching other-project task for an aside. For Claude, use
a fresh named or tmux-launched interactive session, not a background agent.
From another harness targeting Codex, prefer a verified app task API; otherwise
use a fresh named ACPX or interactive session and disclose that it is not an app task.

Fork only for a genuine
need for raw history; the document usually supplies continuation context.

## Report the actual result

Finish with document path, relationship, surface and detection evidence,
placement, isolation, and verified launch status. Do not call a queued worktree
or requested launch started. If the selected app has no verified task-creation
path, stop and report that limitation; context-led autonomy does not authorize
a silent subagent substitute.
