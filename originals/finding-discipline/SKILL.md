---
name: finding-discipline
description: 'Confirm actionable review findings, deduplicate root causes, and exclude nits, vague risks, and style notes.'
---

# Finding discipline

Use this skill after you have inspected enough code to know a concrete runtime
failure or present maintenance cost. The goal is fewer, sharper findings that a
PR author can fix.

## Workflow

1. Treat reviewer output as candidate observations. For each runtime candidate,
   apply the likelihood-impact framework in [Risk rating](#risk-rating), then
   apply the finding bar in [Finding bar](#finding-bar).
2. Apply the three-gate actionability contract in
   [Actionability gate](#actionability-gate). Treat this as the required
   decision point for whether a candidate may produce a finding, code, or a
   test.
3. Drop excluded observations using [Exclusions](#exclusions).
4. Run the confirmation pass in [Confirmation pass](#confirmation-pass).
5. Write each finding with the format and severity rules in [Output](#output).
6. Perform the final review pass before presenting findings.

## Required discipline

- Optimize candidate generation for recall and finding acceptance for precision.
- Prefer no finding over a weak finding.
- Require reality, importance, and repair quality to pass independently.
  Repair quality may authorize either a supported repair or an owner
  consultation when the problem is proven but the repair is not. Neither path
  automatically authorizes a patch or test.
- Put only proven, deliberately tolerated risk in residual risk. Reject
  theoretical possibilities instead of preserving them as warnings.
- Merge duplicates under one root cause.
- Remove findings that depend on unproven assumptions.
- Check each line reference still overlaps the reviewed change when possible.
- Make titles action-oriented, not diagnostic labels.

## Risk rating

Treat reviewer output as a hypothesis. Rate severity only after proving a
current production path and a meaningful consequence.

### Risk reality check

Record this case before the findings CLI assigns severity and disposition:

```text
Production path: <current producer -> transformations -> failing sink>
Reachability evidence: <observed payload, current contract, or repository invariant>
Likelihood: likely | possible | rare | unknown | theoretical
Impact: critical | high | medium | low
Actual consequence: <verified behavior and meaningful user/system impact>
```

Use these likelihood meanings:

- `likely`: observed or reached by normal, recurring supported inputs.
- `possible`: a supported current path reaches it without an exceptional
  combination of events.
- `rare`: a supported current path exists, but requires an unusual input or
  state combination.
- `unknown`: evidence is missing. Investigate; do not guess a probability.
- `theoretical`: only an arbitrary type value, synthetic test, dependency
  maximum, or imagined state reaches it. Reject it.

Use these impact meanings:

- `critical`: exploitable security boundary, irreversible data loss or
  corruption, or broad outage.
- `high`: blocked core workflow, serious data or permission error, or many
  affected users.
- `medium`: bounded correctness or workflow failure with meaningful recovery
  cost.
- `low`: presentation defect, minor inconvenience, or easy recovery without
  material loss.

### Deterministic rating

Supply likelihood and impact. Do not choose severity or disposition; the
findings CLI derives the risk outcome from this table:

| Likelihood | Low impact | Medium impact | High impact | Critical impact |
| --- | --- | --- | --- | --- |
| likely | P3, accept | P2, accept | P1, accept | P0, accept |
| possible | no severity, reject | P2, accept | P1, accept | P1, accept |
| rare | no severity, reject | no severity, reject | P2, consult | P1, consult |
| unknown | no severity, investigate | no severity, investigate | no severity, investigate | no severity, investigate |
| theoretical | no severity, reject | no severity, reject | no severity, reject | no severity, reject |

Low-probability, low-impact risk defaults to no finding and no code. Severity
reflects likelihood and impact together; worst-case impact alone cannot raise a
finding. Supply `--handling fix|consult|follow-up|reject` separately: it routes a
proven finding without changing severity or turning a rejected or unproven risk
into work. Use `reject` with the failed actionability gate and rationale when a
candidate does not deserve intervention. A contained systemic repair may use
`fix`; a material systemic repair uses `consult` before editing. When the owner deliberately
defers an accepted local finding, the CLI records it as residual risk without
changing its severity. The owner may reject a consulted finding without turning
it into an autonomous patch; the terminal update records that separate decision
with `--owner-resolution`. An unanswered consult stays open. A real adjacent
issue uses `follow-up`, is reported as deferred work, and does not block the
current review.

### Disposition

- `accept`: non-synthetic evidence proves the path and consequence, the table
  makes action worthwhile, and the behavior violates a current contract.
- `investigate`: reachability, likelihood, or sink behavior is still unproven.
  Gather evidence; do not patch.
- `consult`: the risk is proven, but tolerance or scope is a product, security,
  compatibility, operational, or architectural choice. Ask before patching.
- `follow-up`: the issue is real but belongs outside the current review. Record
  the owner or next action without blocking the current PR.
- `residual`: the risk is proven and the current change deliberately leaves it
  unresolved. Record it without patching.
- `reject`: the path is theoretical, the combined risk does not justify code,
  or the current contract explicitly allows the proven behavior.

The burden of proof belongs to the finding. A test created from the reviewer's
example can verify a fix after acceptance; it cannot supply missing production
evidence.

### Defence in depth

Rare does not mean harmless. Proven rare/high and rare/critical risks become
consults with P2 and P1 severity respectively. Present the boundary and durable
options before editing. Prefer an existing repository, framework, or dependency
primitive when the user authorizes defence in depth. A custom maze of special
cases fails the fix bar even when the underlying risk is serious.

## Finding bar

A review finding must satisfy all of these:

- Introduced by the reviewed change or newly exposed by it.
- Tied to a specific changed line, symbol, config, or contract.
- Has an evidence-backed, realistic failure mode or a concrete present
  maintenance cost, not just "this looks risky" or "this could be cleaner."
- Explains impact in current product, runtime, or maintenance terms.
- Has either a justified repair direction or a concrete unresolved repair
  decision that is important enough to bring to the owner. A possible patch or
  vague request for guidance is not enough.
- Has enough confidence that a maintainer would likely want the author to act.

### Defensive findings

A finding whose remedy adds a guard, cap, escape, normalization, fallback, or
other defensive path must pass the risk rating and the relevant evidence test:

- For a capacity cap or truncation path, show repository or production evidence
  that a current producer can realistically approach the threshold. A declared
  downstream limit or theoretically unbounded collection is not enough.
- For escaping or delimiter handling, show that a supported or observed input
  can contain the exact delimiter or control character and that the real
  renderer or parser produces a material failure. An arbitrary string type or
  synthetically constructed value is not enough.

A maintenance finding must use repository evidence to prove current unnecessary
complexity, duplication, or code with no current job, and name the reading,
change, test, or ownership cost it adds.

Prefer no finding over a weak finding.

## Actionability gate

A candidate may produce a finding, code, or a test only after these gates pass
in order:

1. **Reality:** trace a supported producer to the claimed boundary and verify
   relevant guards, invariants, and dependency behavior. Arbitrary type values,
   synthetic calls, and dependency maxima are not production evidence.
2. **Importance:** name the violated contract, likelihood, impact, affected
   party, consequence, and recovery. Compare the realistic harm with the
   permanent code, tests, and operational complexity of intervening.
3. **Repair quality:** identify the root cause and owning boundary, compare
   doing nothing with plausible repairs, prefer an existing repository or
   dependency primitive, and count every new branch, fallback, abstraction,
   state transition, test, and failure mode.

A failed gate means reject or investigate. Worst-case impact cannot compensate
for implausible reachability, and a specific patch is not automatically a
justified patch.

Repair quality passes through one of two routes:

- **Repair:** one durable direction is supported and its benefit justifies its
  full cost. Only this route may authorize a patch.
- **Consultation:** the problem is real and important, but the durable direction
  requires an owner decision. Record the exact question, options checked, and
  why none is supported yet; do not patch.

Choose proof after the repair passes. Before adding, changing, or removing a
test, load `test-audit` and let its portfolio decision own whether coverage is
kept, added, consolidated, moved, rewritten, deleted, or unnecessary. A
historical regression alone does not justify a test; visual UI defects usually
need rendered proof instead.

### Required record

An actionable runtime finding records contract evidence, root cause, and
intervention justification in addition to its risk rating. An actionable
maintenance finding records root cause and intervention justification in
addition to maintenance evidence and present cost. A patch, deferral, or
approved consultation also requires the recommended repair. An unresolved or
declined consultation may omit it only when its decision explains why no repair
is supported.

## Exclusions

Do not report:

- style, naming, formatting, architecture taste, or "could be cleaner"
  refactors without a concrete current problem
- generic missing tests unless the missing test hides a specific failure mode
- speculative security concerns without an executable path
- broad "consider" suggestions
- duplicate findings that share the same root cause
- stale findings against code that is not part of the reviewed diff

Use residual risk only for a proven trigger and consequence that the current
change deliberately leaves unresolved. Reject unsupported possibilities rather
than preserving them as notes.

## Confirmation pass

Before finalizing a runtime finding, answer:

1. What exact input, state, timing, permission, platform, or dependency version
   triggers this?
2. What does the code do now, and why is that wrong?
3. Which current contract proves it is wrong: caller expectation, test, docs,
   type, API, UI behavior, security boundary, or previous behavior?
4. What is the root cause, which boundary owns it, and what is the smallest
   durable repair there?
5. Could this be a false positive because of an upstream guard or invariant?
6. Why is the recommended repair better than doing nothing after counting its
   complexity, tests, and new failure modes?

If answers 1-3 are hand-wavy, keep inspecting or drop the finding. If answers
4-6 do not justify a repair, do not patch. Consult only when the proven problem
is important enough for an owner decision and the finding names the repair
question and directions already checked; otherwise investigate or reject it.
Confirm that the finding record contains a complete risk rating. For a
defensive-code finding, check capacity claims and delimiter claims
independently; evidence for one does not prove the other.

For a maintenance finding, answer instead:

1. What exact changed code is unnecessarily complex, duplicated, or unused?
2. What repository evidence proves that present maintenance problem?
3. What present reading, change, test, or ownership cost does it add?
4. What root cause and ownership error creates that cost?
5. What smaller durable code preserves all current behavior?
6. What boundary, domain concept, dependency direction, expected variability,
   or useful test seam would the simplification preserve or remove?
7. Why is changing the code better than tolerating the current maintenance
   cost?

If the evidence for answers 2-3 is hand-wavy, drop the finding.

## Output

Use this shape for each finding:

```md
[P0/P1/P2/P3] Imperative title under 80 characters

The changed code in `path/to/file.ts` now does <bad behavior> when <trigger>.
That breaks <contract/user-visible behavior> because <evidence>. Fix by
<recommended durable direction>. This intervention is justified because
<benefit compared with doing nothing and full repair cost>.
```

Include file and line references as tightly as the harness supports. In Codex
app reviews, emit `::code-comment{...}` findings when the user asked for review
findings.

For a repairless consultation, use this body instead:

```md
[P0/P1/P2] Imperative title under 80 characters

The changed code in `path/to/file.ts` causes <proven behavior> when <trigger>,
affecting <party and consequence>. The root cause belongs to <boundary>. The
repair remains unresolved because <directions checked and why none is yet
supported>. Ask the owner to decide <specific question> before editing code.
```

Use exactly the severity and disposition returned by the findings CLI. Do not
choose or raise severity in prose. A severity attached to `consult` records the
stakes. The consultation is actionable as an owner decision, not as permission
to patch.

For a maintenance finding, use this body instead:

```md
[maintenance] Imperative title under 80 characters

The changed code in `path/to/file.ts` adds <defense, duplication, or
indirection>, and <repository evidence> proves the present maintenance problem.
This adds <specific reading/change/test cost> without improving <behavior or
boundary>. Fix by <specific simplification at the owning boundary>. This
intervention is justified because <benefit compared with doing nothing and full
repair cost>.
```

### Severity

- `P0`: likely, critical impact.
- `P1`: likely or possible high impact, or possible or rare critical impact.
- `P2`: likely or possible medium impact, or rare high impact.
- `P3`: likely, low impact.

Unknown and theoretical risks have no severity. Possible/low and rare/low or
medium risks are rejected. The CLI is authoritative when prose and memory
disagree.
