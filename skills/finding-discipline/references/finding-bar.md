# Finding bar

A review finding must satisfy all of these:

- Introduced by the reviewed change or newly exposed by it.
- Tied to a specific changed line, symbol, config, or contract.
- Has a plausible failure mode or a concrete present maintenance cost, not just
  "this looks risky" or "this could be cleaner."
- Explains impact in current product, runtime, or maintenance terms.
- Gives a specific fix direction.
- Has enough confidence that a maintainer would likely want the author to act.

A maintenance finding must use repository evidence to prove the changed code
has no current job and name the reading, change, test, or ownership cost it adds.

Prefer no finding over a weak finding.
