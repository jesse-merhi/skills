---
name: pr-burndown
description: Get a batch of open PRs merged in parallel, one owner thread per PR, with Jesse's 👍 gating each queue submission.
---

# PR burndown

A coordinator thread runs the burndown; one owner thread carries each PR to merged, including its queue submission after Jesse's 👍. Owners never wait for the coordinator's permission. The coordinator wakes owners when a blocker clears, shares host capacity and asks Jesse for decisions; it does not approve, re-check or accept evidence for owners' work. This needs T3 Code's thread and scheduling tools; if they are missing, say so and stop.

Before ending a turn, make sure your row or `run.json` says what you are waiting on and what comes next.

Read the repository's `AGENTS.md` before starting. It decides which environments agents may change without asking, the queue procedure, what queue CI proves, required local proof, device tooling and budgets, and the ledger location. Where it is silent about an environment, ask Jesse before changing it.

## Shared rules

### Jesse's 👍

When Jesse's 👍 satisfies the `AGENTS.md` sign-off gate, it is also his request to queue that PR, with the repairs, required checks and re-entry the queue rules allow. It survives later commits unless the change grows materially in scope. Paid CI outside the queue still follows the repository's approval rules.

### Questions

Only the coordinator asks Jesse. An owner that needs his decision writes it in its row's `question`, sets `waiting_on: jesse`, notifies the coordinator and continues any work the question does not block. Owners follow Jesse's answers recorded in `run.json`.

### Ledger

The ledger lives where the repository says, else in `~/.local/state/pr-burndown/<run-id>/`. Read it instead of asking another thread for status. The coordinator writes `run.json`: its thread ID, the cap, device budgets, holds, questions and answers. Each owner writes only its row, `prs/<number>.json`, and updates it whenever a field changes:

- `owner`: thread ID and worktree path
- `head`: reviewed head SHA, or null before review
- `evidence`: path to the review and proof record for that head
- `state`: `working`, `awaiting-thumbs-up`, `queued`, `merged` or `closed`
- `waiting_on`: `none`, `job` (your own long command is running), `capacity`, `device`, `jesse`, `ci`, `pr:<number>` or `hold:<id>`
- `since`: UTC time `waiting_on` last changed
- `next_action`: one sentence, naming the platform when waiting on a device
- `question`: the decision needed from Jesse

A message to the coordinator is a one-line pointer to the row.

### Holds

A hold stops specific work for a specific reason. The coordinator records its ID, scope, reason, who placed it and an `expires_at` at most two hours out, then tells the affected owners, who set `waiting_on: hold:<id>`. An expired hold lapses; renew it only with a current reason. Never hold every PR for one problem.

### Capacity

Heavy work means a local stack, devices, end-to-end tests or a full suite, and it needs a slot. To claim one, run `mkdir slots/<n>` in the ledger for `n` from 1 to the cap; a failed `mkdir` means the slot is taken, so try the next. Write your PR number into `slots/<n>/pr`. Remove the slot when the heavy work ends, and while you wait for a device.

The coordinator sets the cap, between 1 and 6. Its first reading comes before the starting cap of 3; after that it reads every 10 minutes: CPU count, 5-minute load and free memory (on macOS, `memory_pressure` with no arguments, because its options allocate memory). Load under twice the CPU count with more than 30% free memory raises the cap by one. Load over four times the CPU count, or under 15% free memory, sets the cap to the slots in use, at least 1. Running work is never stopped.

## Coordinator

1. Set up. Use the PRs Jesse named, or ask him which open PRs are in scope. Write the rows and `run.json`. Reuse each PR's owner thread, or start one with `t3_thread_launch` in the worktree that already has its branch (`git worktree list`), else in a new worktree that runs `gh pr checkout <number>` first. Give it this skill, the ledger path and your thread ID. Schedule a 10-minute check with `schedule_task`, bound to this thread.
2. On each check, read the ledger, thread statuses, host load and merge queue. Resume each owner whose blocker cleared, with its concrete next step:
   - `none`: no active turn, and not `merged` or `closed`.
   - `job`: no active turn and `since` over an hour old.
   - `capacity`: only as many as there are free slots, oldest `since` first.
   - `device`: every check, letting the device tooling decide. After an hour blocked by other sessions' devices, ask Jesse whether to free them.
   - `jesse`: he answered, or his 👍 appeared.
   - `ci`: the PR merged or left the queue. Check the queue yourself; PR watchers miss ejections.
   - `pr:<number>`: that PR merged or closed.
   - `hold:<id>`: it lapsed or was released.

   Resume any slot holder with no active turn. If a slot holder's turn has run over two hours, ask it for status; if nothing changes by the next check, tell Jesse.
3. Ask Jesse one decision per question, one question at a time, in plain English, using the structured question tool, with your recommendation first when you have one. A question must not hold your turn open, because that stops the checks; if the tool blocks, ask in your message and end the turn. This overrides the `AGENTS.md` preference for synchronous questions. Record each answer in `run.json`, send it to the affected owners, and never re-ask. Don't ask what the repository's rules already answer.
4. When PRs reach `awaiting-thumbs-up`, send Jesse one list of links: what each changes, what review fixed, how it was proved, its PR check state and anything a merge triggers. Resend only when it changes; once every PR waits only on Jesse, this list is the summary.
5. End the turn while owners work.

Don't hand out devices by message or track non-merge work; point other work at Jesse or its own thread. When every PR is `merged` or `closed`, delete the scheduled check and summarize.

## Owner

1. Resolve conflicts with the base when GitHub reports them; otherwise keep the head, since the queue tests the combined revision. Set `waiting_on: pr:<number>` only for a hard dependency.
2. Run `code-review` on the head, complete the local proof the repository requires and record both in `evidence`. Where the repository lets a highly confident owner leave runs to queue CI, follow its limits and say why in the PR. Run tests directly; compare caches or provenance only when a run can't start without it.

   Claim a slot before heavy work. If none is free, set `waiting_on: capacity` and end the turn. Pass the `run.json` budgets to the device tooling. If no device is free, remove your slot and set `waiting_on: device`. When the heavy work ends, stop your own stack and devices and remove your slot.
3. Push the reviewed head and update the PR with `pr-proof-pack`. Once its automatic checks pass, mark it ready, set `awaiting-thumbs-up` and `waiting_on: jesse`, and point the coordinator at your row. If Jesse's 👍 is already there, go straight to step 4.
4. Re-read the head. If it changed, review and prove the new head. If the scope grew materially since the 👍, ask through `question` and wait for the answer before submitting. Submit and recover from failed admission or ejection per the repository's queue rules, with `queued` and `waiting_on: ci`. When GitHub confirms the merge, set `merged` and notify the coordinator.
