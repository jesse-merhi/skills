# Finding Bar

A review finding must satisfy all of these:

- Introduced by the reviewed change or newly exposed by it.
- Tied to a specific changed line, symbol, config, or contract.
- Has an evidence-backed, realistic failure mode or a concrete present
  maintenance cost, not just "this looks risky" or "this could be cleaner."
- Explains impact in current product, runtime, or maintenance terms.
- Gives a specific fix direction.
- Has enough confidence that a maintainer would likely want the author to act.

## Defensive Findings

A finding whose remedy adds a guard, cap, escape, normalization, fallback, or
other defensive path must pass the risk rating and the relevant evidence test:

- For a capacity cap or truncation path, show repository or production evidence
  that a current producer can realistically approach the threshold. A declared
  downstream limit or theoretically unbounded collection is not enough.
- For escaping or delimiter handling, show that a supported or observed input
  can contain the exact delimiter or control character and that the real
  renderer or parser produces a material failure. An arbitrary string type or
  synthetically constructed value is not enough.

A maintenance finding must use repository evidence to prove the changed code
has no current job and name the reading, change, test, or ownership cost it adds.

Prefer no finding over a weak finding.
