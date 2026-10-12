---
name: pr-burndown
description: Get a batch of open PRs merged in parallel, one owner thread per PR, with Jesse's 👍 gating each queue submission.
---

# PR burndown

A coordinator thread runs the burndown; one owner thread carries each PR to merged, including its queue submission after Jesse's 👍. Owners never wait for the coordinator's permission. The coordinator wakes owners when a blocker clears, shares host capacity and asks Jesse for decisions; it does not re-check owners' work. This needs T3 Code's thread and scheduling tools; if they are missing, say so and stop.

The repository's `AGENTS.md` decides which environments agents may change without asking, the queue procedure, what queue CI proves, required local proof, device tooling and budgets, and the ledger location. Where it is silent about an environment, ask Jesse first.

## Shared rules

### Jesse's 👍

When Jesse's 👍 satisfies the `AGENTS.md` sign-off gate, it is also his request to queue that PR, including the repairs and re-entry the queue rules allow. It survives later commits unless the change grows materially in scope.

### Questions

Only the coordinator asks Jesse. An owner writes its decision in `question`, sets `waiting_on: jesse`, notifies the coordinator and continues unblocked work.

### Ledger

In the repository's location, else `~/.local/state/pr-burndown/<run-id>/`. The coordinator writes `run.json`: its thread ID, the cap, device budgets, holds, questions and answers. Each owner writes only `prs/<number>.json` with `owner` (thread ID, worktree), `head` (reviewed SHA), `evidence` (path to its review and proof record), `state` (`working`, `awaiting-thumbs-up`, `queued`, `merged`, `closed`), `waiting_on` (`none`, `job`, `capacity`, `device`, `jesse`, `ci`, `pr:<number>`, `hold:<id>`), `since`, `next_action` and `question`. Use `job` while your own long command runs. Message the coordinator with a pointer to your row, not a report.

### Holds

The coordinator records each hold's scope, reason, who placed it and an `expires_at` at most two hours out, then tells affected owners, who set `waiting_on: hold:<id>`. Expired holds lapse. Never hold every PR for one problem.

### Capacity

Heavy work (a local stack, devices, end-to-end tests, a full suite) needs a slot: `mkdir slots/<n>` in the ledger for `n` up to the cap, with your PR number in `slots/<n>/pr`. Remove it when done, and while waiting for a device. Every 10 minutes the coordinator reads CPU count, 5-minute load and free memory (`memory_pressure` with no arguments on macOS). Load under 2× CPUs with over 30% free memory raises the cap by one, to at most 6. Load over 4× CPUs or under 15% free sets the cap to the slots in use, at least 1. Running work is never stopped. The first reading comes before the starting cap of 3.

## Coordinator

1. Set up. Use the PRs Jesse named, or ask him which open PRs are in scope. Write the rows and `run.json`. Reuse each PR's owner thread, or start one with `t3_thread_launch` in the worktree that has its branch (`git worktree list`), else a new worktree that runs `gh pr checkout <number>` first. Give it this skill, the ledger path and your thread ID. Schedule a 10-minute check with `schedule_task` bound to this thread.
2. On each check, read the ledger, thread statuses, host load and merge queue, and resume owners whose blocker cleared:
   - `none`: no active turn, and not `merged` or `closed`.
   - `job`: no active turn and `since` over an hour old.
   - `capacity`: as many as there are free slots, oldest first.
   - `device`: every check. After an hour blocked by other sessions' devices, ask Jesse whether to free them.
   - `jesse`: he answered, or his 👍 appeared.
   - `ci`: the PR merged or left the queue. Check the queue yourself; PR watchers miss ejections.
   - `pr:<number>`: that PR merged or closed. `hold:<id>`: it lapsed or was released.

   Resume a slot holder with no active turn. If its turn has run over two hours, ask for status, then tell Jesse if nothing changes.
3. Ask Jesse one plain question at a time with the structured question tool, recommendation first. A question must not hold your turn open, because that stops the checks; if the tool blocks, ask in your message and end the turn, overriding the `AGENTS.md` preference for synchronous questions. Record answers in `run.json`, pass them on, and never re-ask. Don't ask what the repository's rules already answer.
4. When PRs reach `awaiting-thumbs-up`, send Jesse one list of links: what each changes, what review fixed, how it was proved, its PR check state and anything a merge triggers. Resend only when it changes.
5. End the turn while owners work.

Don't track non-merge work; point it at Jesse. When every PR is `merged` or `closed`, delete the scheduled check and summarize.

## Owner

1. Resolve conflicts with the base when GitHub reports them; otherwise keep the head, since the queue tests the combined revision. Set `waiting_on: pr:<number>` only for a hard dependency.
2. Run `code-review` on the head, complete the local proof the repository requires and record both in `evidence`. Where the repository lets a highly confident owner leave runs to queue CI, follow its limits and say why in the PR. Run tests directly; compare caches or provenance only when a run can't start without it. Take a slot before heavy work, or set `waiting_on: capacity` and end the turn. Pass the `run.json` budgets to the device tooling; if no device is free, release your slot and set `waiting_on: device`. Afterwards stop your own stack and devices and remove your slot.
3. Push the reviewed head, update the PR with `pr-proof-pack`, and once its automatic checks pass mark it ready, set `awaiting-thumbs-up` and `waiting_on: jesse`, and point the coordinator at your row. If the 👍 is already there, continue.
4. Re-read the head; review and prove any new head first, and ask through `question` if the scope grew materially. Queue and recover from ejection per the repository's rules, with `queued` and `waiting_on: ci`. On a confirmed merge, set `merged` and notify the coordinator.
