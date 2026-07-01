# Queue Matching And The Fixed Point

Even with notices, a reviewer may independently re-derive an open queue item.
The codex engine gets no notices at all. Matching exists to recognize those
re-raises during triage, never to fabricate a clean verdict.

## Matching

- Register each consult-queue finding with a fingerprint: file, code element
  (function, hook, config key), and the root cause or behavior in one sentence.
- A finding in a later pass that matches an open queue entry gets a one-line
  match note on that entry instead of a second queue entry or a new fix.
- Record the match so a continuation sees that the re-raise has already been
  matched.
- Match on the same root cause at the same code, not on exact wording or line
  numbers.
- When unsure, treat the finding as new.
- Never feed the queue or prior findings to a reviewer. Bare native reviews take
  no instructions, and cold reviewers must stay neutral. Matching happens only
  while triaging their output.

## Pass Classification With An Open Queue

- `clean-except-queue`: every finding in the pass matches an open queue entry.
  The reviewer confirmed there is nothing new, so the pass counts toward the
  clean streak, but it can never produce a final clean verdict.
- Streak met with a non-empty queue is the **fixed point**: the tree cannot
  change without the user, and re-reviewing an unchanged tree adds nothing.
- Suspend the loop and report `blocked-on-consult` with the queue.
- Do not keep re-running the engine on an unchanged tree past the streak
  requirement.

## Resolution

- The user accepts a queued finding: fix it, close the entry, reset the streak,
  and resume the loop on the changed tree.
- The user rejects it: record the rejection and its reason in the findings
  database. If the streak was already met and no queue entries remain open,
  report success citing those rejections; the completed streak already covered
  this exact tree.
- Never report a fully clean verdict while the queue has open entries.

Why this terminates: every pass either fixes something (bounded by the
diff-growth budget), extends the streak (bounded by the streak requirement), or
suspends on the queue. The wall-clock budget backstops all of it.
