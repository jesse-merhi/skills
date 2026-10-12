---
name: pr-burndown
description: Coordinate a batch of open PRs to merge with one owner thread per PR, a shared ledger, a host capacity cap and Jesse's 👍 gate.
---

# PR burndown

Use this when asked to get a batch of open PRs merged. One coordinator thread runs the burndown and one owner thread works each PR. Both roles read the shared sections, then the section for their role.

Owners never wait for the coordinator's permission. Each owner carries its PR from its current state to merged, including the queue submission after Jesse's 👍. The coordinator wakes owners when a blocker clears, shares the host's capacity, asks Jesse for decisions, and does not approve work or relay messages.

## Repository rules

Read the repository's `AGENTS.md` before starting. It decides which environments agents may change without asking, how a PR enters the merge queue and recovers from ejection, what the queue's CI proves, what local proof a change needs, and which device tooling and budgets apply. Where it says nothing about an environment, ask Jesse before changing it.

## Approval to merge

When Jesse's 👍 satisfies the sign-off gate in `AGENTS.md`, it also counts as his request to submit that PR to the merge queue, with the repairs, required checks and re-entry the repository's queue rules allow. The 👍 stays valid after later commits unless the change has grown materially in scope; then ask again. Paid CI runs outside the queue still follow the repository's approval rules.

## Ledger

Each run keeps its state outside the checkout, in the location the repository names or otherwise `~/.local/state/pr-burndown/<run-id>/`. The coordinator writes `run.json`, which holds the capacity cap, device budgets, holds, Jesse's questions and his answers. Each owner writes only its own row, `prs/<number>.json`. Read the ledger instead of asking another thread for status. A message to the coordinator is a one-line pointer to the row, not a report.

A row records:

- `owner`: the owner's thread ID and worktree path
- `head`: the reviewed head SHA, or null before review
- `state`: `working`, `awaiting-thumbs-up`, `queued`, `merged` or `closed`
- `waiting_on`: `none`, `job`, `capacity`, `device`, `jesse`, `ci`, `pr:<number>` or `hold:<id>`
- `since`: when `waiting_on` last changed, as a UTC timestamp
- `heavy`: true while the owner runs a local stack, devices, end-to-end tests or a full test suite
- `next_action`: one plain sentence, naming the platform when waiting on a device
- `question`: the decision needed from Jesse, when `waiting_on` is `jesse`

Use `job` while your own long-running command is in progress, so the coordinator doesn't resume you on top of it. Waiting for a device or for capacity is not heavy work, so set `heavy: false` while you wait. Update the row whenever one of these changes.

## Holds

A hold stops specific work for a specific reason. The coordinator records each hold in `run.json` with an ID, the affected PRs or resource, the reason, who placed it and an `expires_at` no more than two hours out, then tells the affected owners, who set `waiting_on: hold:<id>`. An expired hold no longer applies; renew it only with a current reason. Never hold every PR to deal with one problem.

## Capacity

Local proof shares one machine. The coordinator keeps a cap on how many owners may do heavy work at once, between 1 and 6 and starting at 3, and records the repository's device budgets in `run.json`. Every 10 minutes it reads the CPU count, the 5-minute load average and the free memory percentage (`memory_pressure` on macOS). When load is under twice the CPU count and more than 30% of memory is free, it raises the cap by one. When load is over four times the CPU count or less than 15% of memory is free, it lowers the cap by one, so no new heavy work starts until the host recovers. Running work is never stopped to make room.

When the repository lets a highly confident owner rely on the queue's CI instead of some local runs, follow its limits and say why in the PR. Heavy local proof is for changes the owner is unsure of, or that are risky or complex.

## Coordinator

1. Set up. Take the PRs Jesse named, or list open PRs with `gh pr list` and ask Jesse which are in scope. Order them by how close each is to merging. Create each PR's row, then reuse its existing owner thread or start one with T3 Code's `t3_thread_launch` in a new worktree, telling it to run `gh pr checkout <number>` first and naming this skill and the ledger path. Owners need threads that persist between turns, so use T3 Code threads rather than short-lived subagents. Write `run.json`. Schedule a 10-minute check with T3 Code's `schedule_task`, bound to this thread.
2. On every check, read the ledger, each owner's thread status, the host load and the merge queue, then resume each owner whose blocker has cleared, giving it the concrete next step:
   - `none`: its thread has no active turn and its state is not `merged` or `closed`.
   - `job`: its thread has no active turn and `since` is more than an hour old, so the owner can check on its run or clean up.
   - `capacity`: fewer rows have `heavy: true` than the cap allows. Resume only as many owners as there are free places, oldest `since` first.
   - `device`: the next check; let the device tooling decide whether a device is free.
   - `jesse`: Jesse answered, or his 👍 appeared on an `awaiting-thumbs-up` PR.
   - `ci`: its PR merged or left the queue unmerged. Check queued PRs yourself, because PR watchers can miss queue ejections and failed combined checks.
   - `pr:<number>`: that PR merged or closed.
   - `hold:<id>`: the hold expired or was released.

   Also resume any owner with `heavy: true` whose thread has no active turn and whose `waiting_on` is not `job`, so it finishes or releases its heavy work.
3. Collect Jesse's decisions. Owners never ask Jesse directly; you ask for them. Use the harness's structured question tool, one decision per question, in plain English, with your recommendation first when you have one. Record each answer in `run.json`, forward it to the affected owners, and never ask it again. Questions that the repository's rules already answer are not questions.
4. Present the 👍 list. When PRs reach `awaiting-thumbs-up`, send Jesse one short list of links. For each PR, say what it changes, what review found and fixed, how it was proved, and the state of its PR checks, plus anything the repository says a merge triggers. Repeat the list only when it changes; when every remaining PR waits only on Jesse, this list is the summary.
5. Wait. End the turn while owners work. Rely on notifications and the scheduled check instead of polling.

The coordinator does not re-review owners' work, accept evidence on their behalf, hand out devices by message, or track work that is not getting a PR merged. Point other workstreams at Jesse or their own thread. When every in-scope PR is `merged` or `closed`, delete the scheduled check and give Jesse a final summary.

## Owner

1. Bring the PR current. Resolve conflicts with the base branch when GitHub reports the PR as conflicting; otherwise keep the current head, because the queue tests the combined revision. Set `waiting_on: pr:<number>` only when a hard dependency must merge first.
2. Review and prove it. Run `code-review` on the current head, then complete the proof the repository requires for the changed scope. Follow Jesse's answers in `run.json`. Run the tests directly; compare caches, fingerprints or provenance only when a run cannot start without that check.

   Before heavy work, count the rows with `heavy: true` in `prs/` against the cap in `run.json`. If the cap is full, set `waiting_on: capacity` and end the turn. Otherwise set `heavy: true` and pass the `run.json` device budgets to the repository's device tooling. When no device is free, set `waiting_on: device`. When the heavy work ends, stop your own stack and devices and set `heavy: false`.
3. Ask for 👍. Push the reviewed head, update the description and proof with `pr-proof-pack`, mark the PR ready, set `state: awaiting-thumbs-up` and `waiting_on: jesse`, and send the coordinator a pointer. If Jesse's 👍 is already present, go straight to submission.
4. Submit and see it through. Re-read the PR head. If it differs from the reviewed head, review and prove the new head first. If the change has grown materially in scope since Jesse's 👍, ask through `question` before submitting. Submit the PR and recover from failed admission or ejection as the repository's queue rules describe, setting `state: queued` and `waiting_on: ci`. When GitHub confirms the merge, set `state: merged` and notify the coordinator.

When a decision needs Jesse, write it in `question`, set `waiting_on: jesse` and notify the coordinator. Keep doing any work the question does not block.
