---
name: handoff
description: 'Transfer the current work to a fresh full agent session, placing related work beside the current session and unrelated asides separately.'
metadata:
  sources: |
    - adapted from [skills/productivity/handoff](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/handoff) — recorded upstream review.
---

# Handoff

Move the work to a fresh full session.

## Write the brief

Save one compact document in the OS temporary directory containing:
- Objective and current state.
- Evidence, blockers, and relevant Obsidian links.
- Next actions, synthesized from what the user asked for.

Include the paths, unfinished changes, decisions, and existing permissions the next session needs. Link artifacts and omit secrets. Carry the existing PR or review plan, not another copy of its workflow.

## Get the launch command

Run `detect-handoff-surface`. It detects the current session and prints the recommended command or native app tool. If the user specified a destination, pass `--destination codex-app|claude-app|codex-cli|claude-cli`.

Use `continuation` by default. Pass `--relationship aside` only for a substantially unrelated user objective. The script handles pane/window placement; do not repeat its detection logic.

## Launch and confirm

Run the recommended command/tool. Use a new worktree only when required; preserve needed uncommitted changes and their base revision in the brief or linked patch.

Launch a full interactive session, never ACPX, subagents, or background agents. Fork only for needed raw history. Ask if the destination is unclear or unavailable.

Confirm the new agent has started and only one new session was created. Report the brief path, session/worktree location, and observed status.
