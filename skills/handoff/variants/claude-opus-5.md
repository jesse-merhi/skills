---
name: handoff
description: 'Transfer work to a fresh full session with verified context and placement.'
---

# Handoff

For Codex destinations, resolve the model and reasoning effort using
[Codex model selection](references/session-routing.md#codex-model-selection)
before launch, and include the selected settings and verification in closeout.

Deliver one compact handoff document and a verified fresh full-session launch,
or the exact limitation preventing it. Use no subagent, delegated in-chat worker,
or background agent anywhere in the handoff.

Write the document in the OS temporary directory. Include objective, state,
evidence, touched files and commands, blockers, validation, Obsidian research
links, suggested skills, and next actions. Link artifacts instead of copying
them; redact secrets and unnecessary personal data. Keep the saved handoff
focused on what the next session needs.

Classify same-objective, feature, investigation, review, or implementation work
as `continuation`; classify a separate user-introduced objective as `aside`.
Default direct follow-on work to continuation, even if it can run independently.

Limit environment discovery to choosing and verifying the full-session route.
Run `scripts/detect-handoff-surface`, read [session-routing.md](references/session-routing.md),
and use the first verified option: explicit destination, current tmux pane,
current app session, supported running app, fresh terminal or ACPX session.
Process ancestry and native markers establish the current session before global
process discovery; tmux elsewhere is insufficient.

Before launch, read [worktree-isolation.md](references/worktree-isolation.md)
for edit, repair, commit, or PR work and
[repair-pr-handoffs.md](references/repair-pr-handoffs.md) for repairs/PRs.
Designate the worktree and add required boundaries, skills, and publication
authority to the receiving brief. Apply the chosen placement:

- tmux uses [tmux-placement.md](references/tmux-placement.md): new pane in the
  current window for continuation, new window in the current session for an aside.
- Codex app uses a fresh same-project task for continuation, projectless or the
  matching other project for an aside, and a worktree for edits when required.
- Claude uses a fresh named or tmux-launched interactive session, never a
  background agent.
- Other harnesses targeting Codex prefer a verified app task API. Otherwise
  use a fresh named ACPX or interactive session and disclose the non-app route.

Fork only when raw conversation history is genuinely necessary.

Completion evidence is the document path, relationship, surface and detection
proof, placement, isolation, and launch status. Queued is not started. If the
selected app lacks a verified creation path, stop with that limitation. Do not
add a verifier worker or silently substitute one for the full session.
