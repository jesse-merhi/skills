---
name: handoff
description: 'Transfer work to a fresh full session with verified context and placement.'
---

# Handoff

For Codex destinations, resolve the model and reasoning effort using
[Codex model selection](references/session-routing.md#codex-model-selection)
before launch, and include the selected settings and verification in closeout.

Create or prepare a fresh full session. Never use a subagent, in-chat worker,
or background agent for any part of this workflow.

1. Gather current state and evidence, batching independent reads. Write one
   compact handoff document in the OS temporary directory. Include the objective,
   touched files and commands, blockers, validation, durable Obsidian research
   links, suggested skills, and next actions. Preserve exact constraints, names,
   identifiers, decisions, and unfinished work. Link existing artifacts, redact
   secrets and unnecessary personal data, and do not rewrite prior session history.
2. Classify the relationship. `continuation` advances the same objective,
   feature, investigation, review, or implementation; `aside` is a separate
   objective introduced by the user. Default direct follow-on work to continuation.
   Independence of execution alone does not make an aside.
3. Run `scripts/detect-handoff-surface`. Read
   [session-routing.md](references/session-routing.md). Prefer, in order, the
   explicit destination, verified current tmux pane, verified current app session,
   supported running app, then a fresh terminal or ACPX session. Use current
   process ancestry and native markers before global discovery. A tmux process
   elsewhere does not identify this session.
4. Before launching edit, repair, commit, or PR work, read
   [worktree-isolation.md](references/worktree-isolation.md), and for repair/PR
   work also [repair-pr-handoffs.md](references/repair-pr-handoffs.md). Designate
   the worktree and add the required boundaries, skills, and publication
   authority to the receiving session's brief. Then launch through the verified route:
   - tmux: follow [tmux-placement.md](references/tmux-placement.md). Put a
     continuation in a new pane of the current window and an aside in a new
     window of the current session.
   - Codex app: create a fresh same-project task for continuation, or a
     projectless/matching other-project task for an aside. Isolate edits in a
     worktree when required by the repo.
   - Claude: use a fresh named or tmux-launched interactive session, not a
     Claude background agent.
   - Other harness to Codex: prefer a verified app task API. Otherwise use a
     fresh named ACPX or interactive session and say that it is not an app task.
5. Fork only when raw history is needed; a continuation does
   not automatically need it because the document carries context.
6. Verify launch. Report document path, relationship, detected surface and its
   evidence, placement, isolation, and status. A queued worktree or launch request
   is not a started session. If the selected app has no verified creation path,
   stop with that exact limitation. Do not substitute a subagent.

During long preparation, report a meaningful change in destination, evidence,
or readiness. Complete the authorized handoff rather than merely promising it.
