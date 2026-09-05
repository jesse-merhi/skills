---
name: handoff
description: 'Transfer full sessions or delegate sustained mechanical work with a verified return path.'
---

# Handoff

Choose the mode from the assignment. For sustained CI observation, established
validation, log collection, or packaging approved evidence, use
[mechanical-worker.md](references/mechanical-worker.md) and finish that mode.
It permits one bounded Luna/medium worker and a verified return to the owner.
Quick commands and already-held waits stay local. Implementation and review
judgment stay with the capable owner.

The remaining instructions govern full-session transfers only.

For Codex destinations, resolve the model and reasoning effort using
[Codex model selection](references/session-routing.md#codex-model-selection)
before launch, and include the selected settings and verification in closeout.

Transfer the work to a fresh full session with enough context to continue.
No part of a handoff may use a subagent, in-chat delegated worker, or background agent.

Write one compact document in the OS temporary directory: objective, current
state, evidence, touched files and commands, blockers, validation, durable
Obsidian research links, suggested skills, and next actions. Link existing
artifacts; redact secrets and unnecessary personal data.

Classify the new work as `continuation` when it advances the same objective,
feature, investigation, review, or implementation; use `aside` for a separate
objective introduced by the user. Direct continuation is the default. Work
being independently executable does not make it an aside.

Run `scripts/detect-handoff-surface` and read
[session-routing.md](references/session-routing.md). Choose the first verified
route: explicit user destination, current tmux pane, current app session,
supported running app, then fresh terminal or ACPX session. Current ancestry
and native session markers outrank global process discovery; tmux running
elsewhere does not establish a current tmux session.

Before launching edit, repair, commit, or PR work, read
[worktree-isolation.md](references/worktree-isolation.md); also read
[repair-pr-handoffs.md](references/repair-pr-handoffs.md) for repair/PR work.
Designate the worktree and enrich the brief with the required boundaries,
skills, and publication authority before dispatch.

Launch according to the verified surface:

- tmux: read [tmux-placement.md](references/tmux-placement.md). Continuations use
  a new pane in the current window; asides use a new window in the current session.
- Codex app: a fresh same-project task for continuation; projectless or matching
  other-project task for an aside. Use an editing worktree when required.
- Claude: a fresh named session or tmux-launched interactive session, never a
  Claude background agent.
- Another harness targeting Codex: prefer a verified app task API. Otherwise use
  a fresh named ACPX or interactive Codex session and disclose that it is not an app task.

Fork only when raw conversation history is genuinely needed; the handoff document
normally provides continuity.

Report document path, relationship, detected surface and evidence, placement,
isolation, and verified launch status. Queued or requested is not started.
If the selected app lacks a verified creation path, report that exact limit
and stop rather than silently substituting a subagent.
