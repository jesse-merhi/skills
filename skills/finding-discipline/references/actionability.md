# Actionability gate

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

Choose proof after the repair passes. Add or change a test only when it is the
narrowest owner of a reachable, stable contract. A historical regression alone
does not justify a test; visual UI defects usually need rendered proof instead.

## Required record

An actionable runtime finding records contract evidence, root cause, and
intervention justification in addition to its risk rating. An actionable
maintenance finding records root cause and intervention justification in
addition to maintenance evidence and present cost. A patch, deferral, or
approved consultation also requires the recommended repair. An unresolved or
declined consultation may omit it only when its decision explains why no repair
is supported.
