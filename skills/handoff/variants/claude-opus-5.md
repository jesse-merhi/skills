---
name: handoff
description: 'Transfer the current work to a fresh full agent session, placing related work beside the current session and unrelated asides separately.'
---

# Handoff

Outcome: create or prepare a full independent session with enough evidence and
state to continue the work. Never use a subagent, delegated in-chat worker, or
background agent for any part of a handoff.

## Prepare context

Write one compact handoff document in the operating system's temporary
directory. Include the objective, current state, evidence, files and commands
already touched, blockers, validation, durable Obsidian research links,
suggested skills, and next concrete actions. Link existing artifacts rather
than copying them. Redact secrets and unnecessary personal data.

Classify the relationship:

- `continuation`: the new session advances the same objective, feature,
  investigation, review, or implementation;
- `aside`: the user introduced a separate objective during the conversation.

Default to `continuation` when the handoff directly continues the current work.
Do not classify work as an aside merely because it can run independently.

## Detect the working surface

Keep environment discovery limited to selecting and verifying the full-session
route.

Run `scripts/detect-handoff-surface`. Read
[session-routing.md](references/session-routing.md), then use the first verified
route:

1. the user's explicit destination;
2. the current verified tmux pane;
3. the current verified app session;
4. a supported app already running;
5. a fresh full terminal or ACPX session.

A tmux process elsewhere on the machine does not make the current session a
tmux session. App and CLI detection uses current process ancestry and native
session markers before global process discovery.

## Launch the full session

- In tmux, read [tmux-placement.md](references/tmux-placement.md). A
  continuation opens a new pane in the current window. An aside opens a new
  window in the current tmux session.
- In the Codex app, create a fresh task in the same project for a continuation.
  Use a projectless task or the matching different project for an aside. Use a
  Codex worktree for editing when the repository requires isolation.
- In Claude, use a fresh named Claude session or a tmux-launched interactive
  Claude session. Do not use Claude background agents.
- From another harness targeting Codex, prefer a verified Codex app task API
  when available. Otherwise use a fresh named ACPX or interactive Codex
  session and report that it is not an app task.

Use a fork only when the new full session genuinely needs raw conversation
history. A continuation does not automatically require a fork because the
handoff document carries its working context.

Read [worktree-isolation.md](references/worktree-isolation.md) before an edit,
repair, commit, or PR handoff. Read
[repair-pr-handoffs.md](references/repair-pr-handoffs.md) for repair and PR
work.

## Completion

Report the handoff document path, relationship, detected surface and evidence,
session placement, isolation, and verified launch status. A queued worktree or
requested launch is not a started session. If the selected app has no verified
task-creation path, stop and report that exact limitation instead of silently
substituting a subagent.
