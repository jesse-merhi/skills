# Fresh Oracle Review Lifecycle

Use this lifecycle only when a substantial delegated change needs review
independent of the active root Sol. High blast radius, weak validation,
material worker drift, compromised root impartiality, or an explicit cold
review request can justify the cold-context cost. Ordinary delegated work stays
with root Sol's targeted review, and tiny direct-Sol work never earns this
extra orchestration.

## 1. Establish the Review Boundary

Run the acceptance validation first. Return an ordinary failing check directly
to the owning implementer instead of paying Sol to rediscover it.

Prepare a compact review packet containing the original observable outcome,
important constraints and invariants, the base and head revisions or net diff,
validation evidence, and the highest-risk contracts. Keep prior discussion and
the root's suspicions out unless they are part of the original requirements.

## 2. Create a Fresh Read-only Reviewer

Create an independent Codex task or session with:

- `gpt-5.6-sol` at `high` reasoning;
- empty inherited history or `fork_turns: none`;
- read-only filesystem permissions; and
- the compact review packet as its complete context.

Verify the runtime-reported model, effort, and permissions. Stop the review and
report a routing failure if they differ; never infer the route from the
reviewer's prose.

The reviewer may inspect the diff and run read-only checks. It never creates,
modifies, deletes, commits, or implements. Require exactly one disposition:

```text
Disposition: ship | fix-first | rethink
Findings: ordered actionable defects with file, evidence, and expected behavior
Validation: checks run and exact results
Residual risk: unverified contract or none
```

`ship` means no material defect was found. `fix-first` means bounded defects can
be corrected without changing the agreed direction. `rethink` means the
requirements, architecture, ownership, or worker tier needs a root decision.

## 3. Route the Result

- On `ship`, let root Sol make the final acceptance decision.
- On `fix-first`, send the exact findings and failing evidence to the same Luna
  or Terra context. The implementer owns the code, regression coverage, commit,
  and validation. Root integrates and independently validates the repair.
- On `rethink`, return to root Sol before more implementation occurs. Root may
  clarify the contract, change direction, or escalate Luna work to Terra.

After a repair, root Sol reruns the failing evidence and resumes its targeted
review. Reuse the same read-only reviewer for a narrow verification only when
root cannot prove the repair or the independent audit itself requires a formal
recheck. Create another fresh reviewer only when the repair materially changes
the architecture or an explicit review policy requires new independence.

After one material repair cycle, a second material miss is evidence of a bad
contract or worker-tier choice. Escalate to Terra or rethink the approach
instead of paying for an unbounded Luna-review loop. Do not pay for repeated
fresh Sol sessions by default. A root Sol correction is appropriate only when
the correction itself falls below the delegation break-even gate.

## 4. Close the Sessions

Archive every independent reviewer after recording its disposition, findings,
validation, model, effort, and permission evidence. Reconcile reviewer and
implementer task IDs before final delivery so rejected, failed, or superseded
sessions are not left active.
