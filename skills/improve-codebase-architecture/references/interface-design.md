# Interface Design

Use this when the user wants alternative interfaces for a chosen deepening
candidate.

## Process

### Frame The Problem

Explain:

- constraints the new interface must satisfy
- dependencies and their category from [deepening.md](deepening.md)
- a short illustrative code sketch to make the constraints concrete

### Explore Alternatives

Produce at least three meaningfully different interface designs:

- Minimum interface: one to three entry points, high leverage per entry point.
- Flexible interface: supports more variation and extension.
- Common-case interface: makes the most common caller trivial.
- Ports-and-adapters interface: when cross-seam dependencies matter.

For each design, include:

1. Interface shape, including invariants, ordering, and error modes.
2. Usage example.
3. What the implementation hides behind the seam.
4. Dependency strategy and adapters.
5. Trade-offs in depth, locality, and seam placement.

### Recommend

Compare the designs and recommend one. If a hybrid is strongest, say which parts
to combine and why.
