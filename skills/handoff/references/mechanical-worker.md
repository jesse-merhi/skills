# Mechanical worker

Delegate one sustained operational phase while the capable owner retains the
task. This mode authorizes one worker for already-authorized work, not new
implementation or publication. Prefer `gpt-5.6-luna` at `medium`. From Claude,
Opus at medium is an allowed alternative when a Luna route is unavailable;
disclose the selection. Respect tool restrictions on model selection and
creation. Do not claim any model is free.

## Decide whether to hand off

Use a worker when several slow observations or established commands would
otherwise keep returning to Astra/Fable: CI across pending runs, an agreed
validation sequence, collecting specified logs, or packaging existing approved
proof. Estimate duration from available run history. Delegate the whole phase
once, only when the brief and final interpretation are smaller than doing it.

A quick status command or one command already held until completion stays with
the owner through `wait-efficiently`. Do not hand off open-ended implementation,
failure diagnosis, review judgment, selecting tests, new browser journeys, or
deciding which evidence proves a feature. No chain of workers or nested delegation.

## Freeze a compact brief

Write one temporary document with these facts, usually under 300 words:

- Parent task/session ID and the verified return channel; worker mode and model.
- Repository/worktree, branch and commit SHA; CI repository and exact run IDs,
  or artifact paths. List all required checks rather than treating an empty
  check list as success. Specify any allowed skipped/neutral conclusions;
  otherwise missing checks or non-success conclusions require owner judgment.
- The complete command sequence or observations already chosen by the owner,
  allowed output directory, and any explicitly permitted incidental outputs.
- Success condition, absolute deadline, and stop conditions: first command/test
  failure, cancelled run, changed head, missing capability, or judgment needed.
- Terminal report: `complete`, `needs-owner`, or `deadline`; target identity,
  completed/remaining checks, exit status, concise failure excerpt and log paths.

The worker may read the shared checkout and write run-owned artifacts. Test
outputs are allowed only as specified. It must not edit source, repair tests,
commit, push, merge, trigger CI, kill processes, rerun failed tests, or change
scope. Freeze the checkout for local validation until the worker returns;
check head before and after and discard stale proof. CI observation can run
beside unrelated owner work, but a new target requires a new explicit brief.

## Launch with a return path

Use the first supported route that can actually return the result. Set model
and effort in launcher arguments, not just prose. Start with the compact brief,
without forked conversation history. Record worker identity and distinguish
requested settings from verified settings. Never select a preset fixed at high.

- **Codex app:** create one fresh full task using `model: "gpt-5.6-luna"` and
  `thinking: "medium"`. Use same-project placement from `handoff`; a read-only
  worker may inspect the specified checkout without creating another editing
  worktree. Verify its real thread ID, not a pending client ID. Use
  `wait_threads` for terminal completion. Where the worker has a tested
  `send_message_to_thread` route to the parent, its terminal message can also
  resume an ended parent; omit model/thinking overrides on that return.
- **Codex subagent:** when a full app task is unavailable and the harness
  supports worker model selection, create one fresh Luna/medium worker with no
  inherited history. Use its native completion/event wait. This is the explicit
  worker-mode exception to full-session handoff, not a full-session transfer.
- **Claude:** use a tracked background Bash command running a fresh
  `codex exec --model gpt-5.6-luna -c 'model_reasoning_effort="medium"'` session
  with the brief, explicit working directory, and output file. Inspect local
  CLI help for the current flags. Its process completion notification is the
  return channel. If Luna cannot be launched, use a fresh Opus/medium worker
  only when the harness exposes and verifies those settings and completion.
  Otherwise retain a single local held command and report the route limitation.

For a CLI/tmux owner without a callback, keep one tracked process/event wait
open. Do not invent a bridge, keystroke injection, scheduler, or periodic model
wakeup. A quiet terminal pane alone cannot wake a parent. A route without a
return mechanism is not a completed handoff.

## Hold ownership until the terminal result

The worker follows `wait-efficiently`, keeps unchanged output inside waits, and
returns only on a stop condition. Capture each command's complete output in the
assigned artifact directory; send small excerpts, not whole transcripts. Never
hide failure with a success-only filter. A tool-wait timeout resumes the same
operation while the assignment deadline remains. The absolute deadline produces
a `deadline` report, not a new worker or a silent extension. Include the IDs of
any still-running processes; the owner retains cleanup responsibility and must
obtain any authority needed to stop them.

The owner does useful independent work or waits for the worker's event. It does
not poll the worker or CI itself. Keep the parent turn active in a held event
wait unless an end-to-end callback has been verified on this harness. `notify`
and a worker's final text alone do not establish that an ended turn will resume.
Use exactly one terminal delivery mechanism per assignment; callbacks should
include the worker ID and target so the owner can reject stale/duplicate results.

On `needs-owner`, the owner diagnoses or fixes only within the user's existing
authorization; otherwise it reports the result and asks for direction. On
completion, it checks the
target and evidence, then resumes review/publication gates. Reuse the worker for
a subsequent authorized mechanical phase where supported; supply the new head
and commands. Archive/close only the worker created for this phase after its
terminal result is captured. An idle model inside a held tool call generates
no reasoning merely because wall time passes; don't promise zero quota cost.

## Exercise the route before relying on it

Trial one bounded CI/validation phase. Record worker identity/model/effort,
parent hold or callback, terminal report, target verification, and unchanged
source. Also exercise first failure and unavailable-callback decisions with an
independent agent. Claim automatic resume of an ended parent only after that
exact path has worked. Repeat the capability trial for a different harness;
Codex evidence does not prove a Claude callback.
