# Extraction Test

Extract a helper only when at least one is true:

- The name captures a domain concept the caller should think in.
- It removes meaningful duplication across real call sites.
- It isolates an external boundary, serialization format, or framework quirk.
- It lowers branching or nesting at the caller.
- It creates a useful test seam for behavior that deserves direct tests.

Do not extract when the helper only makes the reader jump elsewhere to
understand a single line.
