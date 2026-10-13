---
name: pr-burndown
description: Get a batch of open PRs merged in parallel, one owner thread per PR, with Jesse's 👍 gating each queue submission.
---

# PR burndown

Each owner carries one PR through merge, including queue submission after Jesse's 👍. The coordinator wakes blocked owners, shares capacity and asks Jesse for decisions; it does not approve or re-check owners' work.

Read repository `AGENTS.md` for environment permissions, queue rules, local proof, device budgets and ledger location. Ask before changing an environment it doesn't cover. Jesse's 👍 under its sign-off gate authorizes submission, permitted repairs and re-entry; it survives later commits unless scope grows materially. Paid CI outside the queue follows repository approval rules.

Resolve routine choices from the ledger and repository rules.

## Ledger and ownership

Use the repository's ledger location, else `~/.local/state/pr-burndown/<run-id>/`. The coordinator owns `run.json`: session identity, cap, device budgets, holds, decisions, schedule identity and last event delivered per owner. Each owner keeps `prs/<number>.json` current:

- `owner`: session identity and worktree; `head`: reviewed SHA, or null; `evidence`: review/proof path for that head.
- `state`: `working`, `awaiting-thumbs-up`, `queued`, `merged` or `closed`.
- `waiting_on`: `none`, `job` (own running command), `capacity`, `device`, `jesse`, `ci`, `pr:<number>` or `hold:<id>`; `since`: UTC time it changed.
- `next_action`: one sentence, including the platform for device waits; `question`: Jesse's decision needed; `closeout`: cleanup/archive still owed, else null.

Read the ledger instead of asking for status. Link logs and proof; messages name the changed state and point to the row. Owners route decisions through `question` and `waiting_on: jesse`, continuing independent work; only the coordinator asks Jesse.

Use the host’s full-session tools to find, launch and resume owners in their PR worktrees. Reuse existing owners; after a lost launch response, reconcile before retrying. Check active work and queued messages before sending one concrete action per event; use retry keys where supported. Report missing capabilities without claiming unattended progress.

In T3, owners are top-level threads: use `t3_thread_list`, `t3_thread_launch` with explicit `workspaceStrategy`, and `t3_thread_send` with an event-stable `clientRequestId`. Retain returned identities; bounded delegated tasks have a separate lifecycle.

## Holds and capacity

A hold names specific work, reason, creator and an `expires_at` at most two hours out in `run.json`; affected owners use `waiting_on: hold:<id>`. Expiry releases it unless renewed for a current reason. Never hold every PR for one problem.

Heavy work (local stacks, devices, E2E or full suites) requires a slot. Claim one with `mkdir slots/<n>` in the ledger, trying 1 through the cap; a failed `mkdir` means taken. Write the PR number to `slots/<n>/pr`.

Before work and on each check, read CPU count, five-minute load and free memory (`memory_pressure` without arguments on macOS; options allocate memory). Start the cap at 3, within 1–6. Load below twice CPU count and over 30% free memory raises it by one; load above four times CPU count or under 15% free memory lowers it to occupied slots, minimum 1. Don't stop running work.

## Coordinator

1. Resolve PR scope, initialize the ledger and give owners this skill, row path and coordinator ID. Use the host scheduler for one owned ten-minute check bound to the coordinator, reusing its identity and preserving Jesse’s stops. Its prompt needs only this skill, ledger path and check objective. Without persistent scheduling, report uncovered events and retain pending work in the ledger. In T3, use `schedule_task` with a stable `clientRequestId`.
2. Reconcile ledger, threads, host load and GitHub. Wake owners when their blocker clears:
   - `none`: idle and neither merged nor closed; `job`: idle and `since` over an hour old.
   - `capacity`: free slots, oldest first; `device`: let device tooling retry each check. After an hour blocked by other sessions' devices, ask Jesse before freeing them.
   - `jesse`: answer or 👍 received; `pr:<number>`: merged/closed; `hold:<id>`: released/expired.
   - `ci`: current combined run failed, queue membership changed, or merge confirmed. Verify head, queue and combined run: an old green notification proves none of these, and departure can mean ejection or merge.
   Reconcile an idle slot holder's saved job before waking it. For a two-hour active turn, request status once; escalate unchanged state at the next check.
3. Ask one decision at a time under Jesse's question-tool preference, with a recommendation. Record and distribute answers; don't re-ask settled or repository-defined decisions.
4. Group PRs awaiting 👍 into one list: links, changes, review fixes, proof, check state and merge effects. Resend only on change. Follow [wait-efficiently](../wait-efficiently/SKILL.md) while owners work.

Keep reconciliation active for needed events the host does not deliver, including sign-off reactions. Disable the owned schedule and verify when all PRs are merged/closed and closeout is complete, or Jesse stops it; a queued tick must preserve the stop. Report open PRs and unfinished closeout separately. Don't allocate devices by message or track unrelated work. A requested [handoff](../handoff/SKILL.md) carries the ledger and schedule identity.

## Owner

1. Fix base conflicts reported by GitHub; otherwise keep the head for combined queue validation. Use `pr:<number>` only for hard dependencies.
2. Run `code-review` and required local proof, recording both in `evidence`. Use repository exceptions for queue-only CI within their limits and explain why in the PR. Run tests directly; investigate caches/provenance only if needed to start.
   Claim a slot before heavy work; if unavailable, set `waiting_on: capacity` and end the turn. Pass ledger budgets to device tooling. If no device is free, release the slot and wait on `device`. When work ends, stop owned stacks/devices and release the slot.
3. Push the reviewed head, update `pr-proof-pack`, and follow [wait-efficiently](../wait-efficiently/SKILL.md). After checks pass, mark ready, set `awaiting-thumbs-up`/`jesse`, and notify the coordinator. An existing 👍 proceeds directly.
4. Re-read the head; review/prove changes and ask through `question` if scope grew materially. Submit and recover under repository queue rules, recording `queued`/`ci`. On confirmed merge, record `merged`, notify the coordinator and complete authorized [cleanup-and-archive](../cleanup-and-archive/SKILL.md) closeout before clearing it.
