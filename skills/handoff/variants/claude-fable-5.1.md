---
name: handoff
description: 'Transfer work to a fresh full session with verified context and placement.'
metadata:
  sources: |
    - adapted from [skills/productivity/handoff](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/handoff) — recorded upstream review.
---

# Handoff

Move the work to a fresh full session.

## Write the brief

Save one self-contained document in the OS temporary directory containing:
- Objective, user-visible result, current state and important design decisions.
- Observed evidence, verification, blockers, PR/proof links and relevant Obsidian links.
- Remaining work, what the user should inspect and next actions based on the user's request.

Use enough explanation for the complexity. For a pending decision, describe the observed problem, consequences and real alternatives, and recommend a path; counts and hashes alone do not explain it.

Include the paths, unfinished changes, decisions, and existing permissions the next session needs. Carry the user instructions that authorize remaining work and any later corrections that supersede old unanswered questions; a handoff does not require the user to approve the same work again. Link artifacts and omit secrets. Carry the existing PR or review plan; do not copy its workflow into the brief.

## Get the launch command

Run `detect-handoff-surface`. It detects the current session and prints the recommended command or native app tool. If the user specified a destination, pass `--destination codex-app|claude-app|codex-cli|claude-cli`.

Use `continuation` by default. Pass `--relationship aside` only for a substantially unrelated user objective. The script handles pane/window placement; do not repeat its detection logic.

## Launch and confirm

For a Codex destination, read [Codex launch settings](references/codex-settings.md) before launch.

Run the recommended command or use the recommended native tool. Use a new worktree only when required; preserve needed uncommitted changes and their base revision in the brief or linked patch.

Launch a full interactive session, never ACPX, subagents, or background agents. Fork only for needed raw history. Ask if the destination is unclear or unavailable.

Confirm the new agent has started and only one new session was created. Report the brief path, session/worktree location, and observed status.
