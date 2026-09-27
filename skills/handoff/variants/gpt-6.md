---
name: handoff
description: 'Transfer the current work to a fresh full agent session, placing related work beside the current session and unrelated asides separately.'
metadata:
  sources: |
    - adapted from [skills/productivity/handoff](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/handoff) — recorded upstream review.
---

# Handoff

## Write the brief

Save a self-contained brief in the OS temporary directory with:
- Objective, user-visible result, current state, and design decisions.
- Evidence, verification, blockers, PR/proof links, and relevant Obsidian links.
- What was tried or ruled out and why, and problems hit with their resolutions.
- Remaining work, what the user should inspect, and next actions.

For a pending decision, explain the observed problem, consequences, alternatives, and recommended path; counts and hashes alone are not enough.

Include paths, unfinished changes, decisions, and the user's instructions, constraints and preferences in close to their own words, including authorization for remaining work and later corrections that supersede unanswered questions. Keep names, numbers, commands and error text exact; condense your own reasoning to its conclusions. Do not ask the user to reapprove authorized work. Link artifacts, omit secrets, and carry the PR or review plan without copying its workflow.

State in the brief and launch prompt: after launch, parent and child do not communicate unless the user explicitly requests it, and only within that request's scope; both report to the user.

## Get the launch command

Run `detect-handoff-surface` for the recommended command or native app tool. For a user-specified destination, pass `--destination codex-app|claude-app|codex-cli|claude-cli`.

Use `continuation` by default and `--relationship aside` only for a substantially unrelated objective. Let the script choose pane/window placement.

## Launch and confirm

For a Codex destination, read [Codex launch settings](references/codex-settings.md) before launch.

Run the recommended command or native tool. Use a new worktree only when required; preserve needed uncommitted changes and base revision in the brief or linked patch.

Launch a full interactive session, not ACPX, a subagent, or a background agent. Fork only for needed raw history. Ask if the destination is unclear or unavailable.

Confirm from launch result or read-only status that one new session started. Report brief path, session/worktree location, and observed status.
