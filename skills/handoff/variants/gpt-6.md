---
name: handoff
description: 'Transfer the current work to a fresh full agent session, placing related work beside the current session and unrelated asides separately.'
metadata:
  sources: |
    - adapted from [skills/productivity/handoff](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/handoff) — recorded upstream review.
---

# Handoff

## Brief

Save a self-contained brief in the OS temporary directory covering:

- Objective, current state, paths, unfinished changes and next actions.
- Decisions, attempted approaches, failures/resolutions, proof and relevant PR/Obsidian links.
- User instructions, constraints, preferences and remaining authority, preserving later corrections and exact names, commands and errors.
- Pending decisions: observed problem, consequences, alternatives and recommendation.
- Owned runtimes (devices, servers, bundlers, stacks), identifiers, ownership evidence, state, stop instructions/failures and manual-testing needs.
- Owned PR watches and schedules, including their identities.

Link artifacts, omit secrets and condense reasoning to conclusions. Carry the PR/review plan without copying its workflow or asking for settled approval. Keep runtimes running for continuations and unrelated asides; the final task owner releases them through [cleanup](../cleanup/SKILL.md).

State in brief and launch prompt: parent and new session communicate only when explicitly requested, within that scope; both report to the user.

## Launch and confirm

Launch a full interactive session, not a subagent, ACPX or background agent. Preserve required dirty changes and base revision in the checkout or linked patch. Ask only if destination cannot be resolved.

**T3:** use `t3_thread_launch` with explicit `workspaceStrategy`: `existing_worktree` for the continuation's verified dirty checkout, or `worktree` with the intended `baseRef` for new work. Stop parent implementation before sharing its checkout. Inherit project/model/modes unless directed otherwise; pass the brief path and objective in `message`. After a lost response, verify existing launch candidates before retrying. Follow preparation with [wait-efficiently](../wait-efficiently/SKILL.md) and link `[title](t3-thread://v1/<threadId>)`.

Watches and schedules don't move automatically: transfer owned monitoring once the destination owns the work, preserve stopped schedules and remove the old watch. Authorized archival follows [cleanup-and-archive](../cleanup-and-archive/SKILL.md), retaining the continuation's runtimes.

**Other hosts:** run `detect-handoff-surface`; use `--destination codex-app|claude-app|codex-cli|claude-cli` for an explicit destination. Default to `continuation`; use `--relationship aside` for unrelated work. Let the detector choose placement. For Codex, read [launch settings](references/codex-settings.md). Run the selected command/native tool; fork only for needed raw history.

Confirm one session started through launch output or read-only status. Report brief path, session/worktree and observed status.
