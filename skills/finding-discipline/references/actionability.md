# Actionability gate

A review candidate becomes actionable only after three independent gates pass.
Run them in order. A candidate that fails a gate may be recorded as rejected for
the audit trail, but it is not a finding, does not trigger code, and does not
trigger a regression test.

Actionable means the proven problem justifies either a supported repair or an
owner decision. It does not by itself authorize code.

## 1. Reality

Prove the failure or present maintenance cost exists in the reviewed system:

- trace a current producer through relevant transformations to the failing
  boundary
- verify upstream guards, repository invariants, supported configuration, and
  dependency behavior
- distinguish production evidence from arbitrary type values, synthetic calls,
  dependency maxima, and tests invented from the candidate

Done when the trigger is reachable through a current supported path and the
claimed behavior follows from inspected code or authoritative dependency
behavior. Otherwise reject or investigate.

## 2. Importance

Decide whether the proven behavior deserves intervention:

- name the current product, API, security, data, or maintenance contract and
  whether the behavior violates it
- rate likelihood and impact separately
- name who or what is affected, what they experience, and how recovery works
- compare the expected harm with the permanent code, tests, operational work,
  and complexity an intervention would add

Worst-case impact does not compensate for implausible reachability. A real but
low-value inconvenience can still be rejected when changing the system would
cost more than tolerating it.

Done when maintaining the status quo is clearly worse than addressing the
candidate. Otherwise reject it.

## 3. Repair quality

Evaluate the proposed repair separately from the problem:

- identify the root cause and the boundary that owns it
- compare doing nothing with the plausible repair directions
- prefer an existing repository, runtime, framework, or dependency primitive
- choose the smallest durable repair at the owning boundary
- account for new branches, fallbacks, abstractions, state, tests, operational
  burden, and failure modes introduced by the repair

A small patch is not preferred when it hides a symptom or leaves the same cause
elsewhere. A specific patch is not automatically a justified patch.

This gate passes in either of two ways:

- **Repair:** the recommended repair addresses the root cause at the correct
  boundary and its benefit justifies its full cost.
- **Consultation:** the problem is proven and important, but no repair direction
  is sufficiently supported; the unresolved owner decision and the repair
  directions already checked are concrete enough to ask without inventing a
  recommendation.

A consultation is an actionable finding because the problem merits an owner
decision, but it never authorizes a patch. If evidence about the problem is
still missing, investigate. If the problem is too low-value to justify either a
durable repair or an owner decision, reject it.

## Verification

Choose proof after the repair passes. Add or change a test only when it protects
a reachable, stable contract at the lowest practical layer. A historical
regression alone does not justify a test. For visual UI defects, prefer rendered
UI proof unless there is stable behavior or state worth automating.

## Required record

An actionable runtime finding records contract evidence, root cause, and
intervention justification in addition to its risk rating. An actionable
maintenance finding records root cause and intervention justification in
addition to maintenance evidence and present cost. A patch or deferral also
requires a recommended repair. An unresolved or declined consultation may omit
it only when its decision records the repair question, directions checked, and
why no recommendation is yet supported.

For a repair, the intervention justification explains why the recommendation is
better than doing nothing after considering complexity and new failure modes.
For a consultation, it explains why an owner decision is worth requesting now.
Only the repair path can authorize a patch.
