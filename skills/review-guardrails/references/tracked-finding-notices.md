# Tracked-Finding notices

Open Class B findings sit unfixed in the tree, so every later pass would
re-derive them and the streak would degrade. Give later reviewers the open-thread
fact, the way a visible review thread does, and nothing more:

```text
Already tracked by the maintainer, do not re-report:
D7 - refunds.ts isRefundActive(): pending refunds not treated as active.
Related issues in the same code ARE in scope.
```

Rules:

- Add one line per open queue entry to the reviewer's checklist or target
  instructions.
- Use facts only: no severity, no rationale, no proposed fix, no opinion on
  validity.
- Never say or imply the code is fine.
- Rebuild the notice list from currently open consult entries in the findings
  database at every reviewer dispatch.
- Confirm current status with `review-findings query`.
- Never copy a notice list from a previous pass or maintain it by hand.
- Only the orchestrating agent writes queue entries and notices.
- Reviewers never edit the queue or finding records before their verdict.

Engine support:

- Claude workflow: put the notice in target instructions.
- Cold reviewers: put it as a checklist line.
- Bare `codex review`: no target instructions are available, so the codex
  engine cannot send notices. With open Class B findings, suspend as
  blocked-on-consult at the first clean-except-queue pass instead of burning a
  degraded streak.
