---
name: pr-burndown
description: Get a batch of open PRs merged in parallel, one owner thread per PR, with Jesse's 👍 gating each queue submission.
---

# PR burndown

Use this when asked to get a batch of open PRs merged. One coordinator thread runs the burndown and one owner thread works each PR. Both roles read the shared sections, then the section for their role. This workflow needs T3 Code's thread and scheduling tools, because owners must persist between turns; if they are unavailable, say so and stop.

Owners never wait for the coordinator's permission. Each owner carries its PR from its current state to merged, including the queue submission after Jesse's 👍. The coordinator wakes owners when a blocker clears, shares the host's capacity and asks Jesse for decisions. It does not approve or re-check owners' work.

When you end a turn, make sure your row's `waiting_on` and `next_action`, or the coordinator's `run.json`, say what you are waiting on and what comes next.

## Repository rules

Read the repository's `AGENTS.md` before starting. It decides which environments agents may change without asking, how a PR enters the merge queue and recovers from ejection, what the queue's CI proves, what local proof a change needs, the device tooling and budgets, and where the ledger lives. Where it says nothing about an environment, ask Jesse before changing it.

## Approval to merge

When Jesse's 👍 satisfies the sign-off gate in `AGENTS.md`, it also counts as his request to submit that PR to the merge queue, with the repairs, required checks and re-entry the repository's queue rules allow. The 👍 stays valid after later commits unless the change has grown materially in scope; then ask again. Paid CI runs outside the queue still follow the repository's approval rules.

## Questions for Jesse

Only the coordinator asks Jesse. An owner that needs a decision writes it in its row's `question`, sets `waiting_on: jesse`, notifies the coordinator and keeps doing any work the question does not block.

## Ledger

Each run keeps its state outside the checkout, in the location the repository names or otherwise `~/.local/state/pr-burndown/<run-id>/`. The coordinator writes `run.json`, which holds its own thread ID, the capacity cap, device budgets, holds, Jesse's questions and his answers. Each owner writes only its own row, `prs/<number>.json`. Read the ledger instead of asking another thread for status. A message to the coordinator is a one-line pointer to the row, not a report.

A row records:

- `owner`: the owner's thread ID and worktree path
- `head`: the reviewed head SHA, or null before review
- `evidence`: the path to the owner's review and proof record for that head
- `state`: `working`, `awaiting-thumbs-up`, `queued`, `merged` or `closed`
- `waiting_on`: `none`, `job`, `capacity`, `device`, `jesse`, `ci`, `pr:<number>` or `hold:<id>`
- `since`: when `waiting_on` last changed, as a UTC timestamp
- `next_action`: one plain sentence, naming the platform when waiting on a device
- `question`: the decision needed from Jesse, when `waiting_on` is `jesse`

Use `job` while your own long-running command is in progress, so the coordinator doesn't resume you on top of it. Update the row whenever one of these changes.

## Holds

A hold stops specific work for a specific reason. The coordinator records each hold in `run.json` with an ID, the affected PRs or resource, the reason, who placed it and an `expires_at` no more than two hours out, then tells the affected owners, who set `waiting_on: hold:<id>`. An expired hold no longer applies; renew it only with a current reason. Never hold every PR to deal with one problem.

## Capacity

Local proof shares one machine. Heavy work means running a local stack, devices, end-to-end tests or a full test suite. An owner may do heavy work only while it holds a slot: a directory `slots/<n>` in the ledger, where `n` runs from 1 to the cap in `run.json`. Claim a slot with `mkdir`, which fails when the slot is taken, and write your PR number into `slots/<n>/pr`. Remove the slot when the heavy work ends. Waiting for a device is not heavy work, so give up your slot while you wait.

The coordinator sets the cap from host readings, between 1 and 6. Every 10 minutes it reads the CPU count, the 5-minute load average and the free memory percentage (on macOS, `memory_pressure` with no arguments; its options allocate memory). When load is under twice the CPU count and more than 30% of memory is free, it raises the cap by one. When load is over four times the CPU count or less than 15% of memory is free, it sets the cap to the number of slots in use, at least 1, so no new heavy work starts until the host recovers. Running work is never stopped to make room. It takes the first reading before setting the starting cap of 3.

## Coordinator

1. Set up. Take the PRs Jesse named, or list open PRs with `gh pr list` and ask Jesse which are in scope. Create each PR's row and write `run.json`. Reuse the PR's existing owner thread if there is one. Otherwise start one with `t3_thread_launch`: in the worktree that already has the PR branch checked out (`git worktree list`), or else in a new worktree, telling it to run `gh pr checkout <number>` first. Name this skill, the ledger path and your thread ID in its message. Schedule a 10-minute check with `schedule_task`, bound to this thread.
2. On every check, read the ledger, each owner's thread status, the host load and the merge queue, then resume each owner whose blocker has cleared, giving it the concrete next step:
   - `none`: its thread has no active turn and its state is not `merged` or `closed`.
   - `job`: its thread has no active turn and `since` is more than an hour old, so the owner can check on its run or clean up.
   - `capacity`: a slot is free. Resume only as many owners as there are free slots, oldest `since` first.
   - `device`: the next check; let the device tooling decide whether a device is free. If the owner has waited more than an hour because other sessions' devices fill the budget, ask Jesse whether to free them.
   - `jesse`: Jesse answered, or his 👍 appeared on an `awaiting-thumbs-up` PR.
   - `ci`: its PR merged or left the queue unmerged. Check queued PRs yourself, because PR watchers can miss queue ejections and failed combined checks.
   - `pr:<number>`: that PR merged or closed.
   - `hold:<id>`: the hold expired or was released.

   Also check each slot. If its owner's thread has no active turn, resume the owner to finish or release its heavy work. If the owner's turn has been active for more than two hours, ask it for status, and tell Jesse at the next check if nothing changed.
3. Ask Jesse for decisions. Use the harness's structured question tool, one decision per question and one question at a time, in plain English, with your recommendation first when you have one. Do not let a question hold your turn open, because a blocked turn stops every scheduled check: if the question tool waits for his answer, ask in your message instead and end the turn. This overrides the general preference for synchronous questions in `AGENTS.md`. Record each answer in `run.json`, send it to the affected owners, and never ask it again. Questions that the repository's rules already answer are not questions.
4. Present the 👍 list. When PRs reach `awaiting-thumbs-up`, send Jesse one short list of links. For each PR, say what it changes, what review found and fixed, how it was proved, and the state of its PR checks, plus anything the repository says a merge triggers. Repeat the list only when it changes; when every remaining PR waits only on Jesse, this list is the summary.
5. Wait. End the turn while owners work. Rely on notifications and the scheduled check instead of polling.

The coordinator does not re-review owners' work, accept evidence on their behalf, hand out devices by message, or track work that is not getting a PR merged. Point other workstreams at Jesse or their own thread. When every in-scope PR is `merged` or `closed`, delete the scheduled check and give Jesse a final summary.

## Owner

1. Bring the PR current. Resolve conflicts with the base branch when GitHub reports the PR as conflicting; otherwise keep the current head, because the queue tests the combined revision. Set `waiting_on: pr:<number>` only when a hard dependency must merge first.
2. Review and prove it. Run `code-review` on the current head, then complete the local proof the repository requires for the changed scope, and record both in `evidence`. If the repository lets a highly confident owner leave some runs to the queue's CI, follow its limits and say why in the PR. Follow Jesse's answers in `run.json`. Run the tests directly; compare caches, fingerprints or provenance only when a run cannot start without that check.

   Claim a slot before heavy work. If every slot is taken, set `waiting_on: capacity` and end the turn. Pass the `run.json` device budgets to the repository's device tooling. When no device is free, release your slot and set `waiting_on: device`. When the heavy work ends, stop your own stack and devices and remove your slot.
3. Ask for 👍. Push the reviewed head, update the description and proof with `pr-proof-pack`, and wait for the PR's automatic checks to pass. Then mark the PR ready, set `state: awaiting-thumbs-up` and `waiting_on: jesse`, and send the coordinator a pointer. If Jesse's 👍 is already present, go straight to submission.
4. Submit and see it through. Re-read the PR head. If it differs from the reviewed head, review and prove the new head first. If the change has grown materially in scope since Jesse's 👍, ask through `question` before submitting. Submit the PR and recover from failed admission or ejection as the repository's queue rules describe, setting `state: queued` and `waiting_on: ci`. When GitHub confirms the merge, set `state: merged` and notify the coordinator.
