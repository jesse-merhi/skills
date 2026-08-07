# Finding Bar

A review finding must satisfy all of these:

- Introduced by the reviewed change or newly exposed by it.
- Tied to a specific changed line, symbol, config, or contract.
- Has a plausible failure mode or a concrete present maintenance cost, not just
  "this looks risky" or "this could be cleaner."
- Explains impact in current product, runtime, or maintenance terms.
- Gives a specific fix direction.
- Has enough confidence that a maintainer would likely want the author to act.

A maintenance finding must cite repository evidence for the unnecessary code:
for example, no current producer or contract makes the defended state plausible,
or a one-use helper only forwards or trivially transforms a value without
preserving a domain concept, boundary, dependency direction, or useful test
seam.

Prefer no finding over a weak finding.
