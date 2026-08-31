# Cold review loop

Before the loop, resolve `review_findings_bin` from the installed `code-review`
skill directory as required by `review-guardrails`. Use its absolute launcher;
never invoke a bare `review-findings` command.

Maintain two integers across the whole session:

```text
consecutive_clean = 0
iterations = 0
```

Repeat:

```text
1. If the wall-clock budget has expired:
     Record stop reason `budget-expired` in the findings CLI or final report.
     STOP and report unresolved state honestly.
2. iterations += 1
   Track the phase, iteration, target, reviewed head, and current clean count.
3. Invoke cold-pr-review against the target.
   - Use a fresh subagent.
   - Pass only target + review checklist.
4. Triage the findings:
   - reject only with recorded evidence
   - for a runtime candidate, run `finding-discipline`'s likelihood-impact risk
     rating
   - for a maintenance candidate, use `--maintenance-evidence` to prove current
     unnecessary complexity, duplication, or code with no current job, and
     `--present-cost` for its concrete reading, change, test, or ownership cost
   - apply `finding-discipline`'s reality, importance, and repair-quality gates;
     only actionable candidates may receive `--handling fix`
   - record contract evidence for every actionable runtime candidate, plus root
     cause, recommended repair, and intervention justification for every
     actionable candidate
   - CLI-derived `investigate` or `consult` -> no patch; investigate or queue it
   - accepted finding with uncertain repair -> provisional-fix test (review-guardrails):
       pass -> fix now, log Provisional, ask the user without waiting
       fail -> consult queue (Class B), ask the user without waiting
   - findings matching an open queue entry -> match note, no new entry
   If open questions for the user have reached consult_cap ->
     Record the open queue and stop reason `blocked-on-consult`.
     SUSPEND as blocked-on-consult: present all open questions and wait.
5. Classify the review:
   - clean              -> no findings, or only evidence-rejected ones
   - clean-except-queue -> every remaining finding matches the open queue
   - has_findings       -> at least one actionable finding remains
6. If clean or clean-except-queue:
     consecutive_clean += 1
     Track the run verdict and clean count.
     If consecutive_clean >= 1:
       If the consult queue is empty -> record stop reason `clean-pass-met`,
               then STOP and report success.
       Else -> record stop reason `blocked-on-consult`,
               then SUSPEND as blocked-on-consult: present the queue and wait
               for the user. Do not run more reviews on this unchanged tree.
     Else -> go to step 1 without editing anything.
7. If has_findings:
     consecutive_clean = 0
     Fix the actionable findings with the smallest durable edits at the owning
     boundary.
     Run relevant verification for the fixes.
     Record each command, result, and reason with the findings CLI.
     Run `"$review_findings_bin" scope-check --reason <remaining work and why it may
     merit more scope>`.
     If it exits non-zero -> record stop reason `blocked-on-consult`, follow
       `review-guardrails`' plain-language scope-request rule, and STOP before
       another review or fix.
     Keep fixed-finding details in the findings CLI.
     Go to step 1.
```

Resume after the user answers a suspended loop:

- Any accepted finding -> fix it, close its queue entry, reset
  `consecutive_clean` to 0, and go to step 1 on the changed tree.
- All open entries rejected -> record the decisions; the completed clean target
  already covered this exact tree, so STOP with success citing those rejections.

When a task-specific requirement raises the clean target above 1, do not edit
code between consecutive clean reviews. The streak is only meaningful if
independent reviewers are looking at the same tree.
