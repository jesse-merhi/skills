# Claude engine

Inside Claude Code, invoke the built-in reviewer through its named workflow.
This is the same finder-and-verify review that `/code-review` runs, and the
workflow namespace cannot be shadowed by a personal skill of the same name:

```text
Workflow({ name: "code-review", args: "<level> [target]" })
```

- Levels: `high`, `xhigh`, or `max` only; default to `high`. The workflow has no
  low/medium level. Any first token that is not one of these three is treated as
  part of the target and the level silently falls back to `high`, so always
  spell the level out.
- Everything after the level is the review target only:
  - `<base>...HEAD` (for example `main...HEAD`) for branch-vs-base review;
  - a commit SHA for one commit;
  - a PR number for a checked-out PR.
- Require a clean committed checkout before invoking the workflow. After
  accepted fixes, validate them and commit the pass as one batch before
  reviewing the new `HEAD`.
- Pass only the target. The workflow accepts free-form instructions in the
  target string, but nothing else goes in: no checklists, prior findings,
  implementation rationale, or desired verdicts. Match returned candidates
  against the findings registry only after the review completes.
- The workflow runs in the background and its verified findings arrive as a task
  notification. Wait for that notification; do not edit the tree or start the
  next iteration while a review is in flight.
- Each run fans out finder and verifier subagents (a `high` run measured roughly
  24 agents, 800k subagent tokens, and 9 minutes). The loop still requires
  `required_clean = 2`, so say what repeated runs cost before starting if the
  user has not already accepted an until-clean loop.
- Findings come back with `CONFIRMED` or `PLAUSIBLE` verdicts and are
  recall-biased at higher levels, so triage with `finding-discipline` before
  fixing.
- Do not run this engine through a nested `claude -p "/code-review ..."` call:
  slash-command names resolve personal skills first, so a personal
  `code-review` skill shadows the built-in reviewer there.

A workflow that errors, is interrupted, or returns no verdict is not clean.
