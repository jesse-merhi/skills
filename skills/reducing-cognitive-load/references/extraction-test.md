# Extraction Test

Extract a helper only when at least one is true:

- The name captures a domain concept the caller should think in.
- It removes meaningful duplication across real call sites.
- It isolates an external boundary, serialization format, or framework quirk.
- It lowers branching or nesting at the caller.
- It creates a useful test seam for behavior that deserves direct tests.

Do not extract when the helper only makes the reader jump elsewhere to
understand a single line.

Treat a one-use helper as a proxy helper when it only forwards a call, converts
a value to another representation, or applies a small transformation that is
clearer at the call site. Inline it unless the helper passes one of the tests
above. A hypothetical future call site is not meaningful duplication.

A helper that exists only to defend against an implausible state is a stronger
finding: first remove the unsupported defense, then inline whatever trivial
work remains.
