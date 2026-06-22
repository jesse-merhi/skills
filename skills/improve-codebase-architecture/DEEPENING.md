# Deepening

How to deepen a cluster of shallow modules safely. Assumes the
vocabulary in [LANGUAGE.md](LANGUAGE.md): **module**, **interface**,
**seam**, and **adapter**.

## Dependency Categories

### In-Process

Pure computation, in-memory state, no I/O. Usually safe to deepen by
merging modules and testing through the new interface.

### Local-Substitutable

Dependencies with local test stand-ins, such as an in-memory filesystem
or local database substitute. Deepen when the stand-in exists and tests
can run through the module interface.

### Remote But Owned

Your own services across a network seam. Define a port at the seam. The
deep module owns the logic; transport is injected as an adapter. Tests
use an in-memory adapter. Production uses HTTP, gRPC, or a queue
adapter.

### True External

Third-party systems you do not control. The deepened module takes the
external dependency as an injected port; tests provide a mock adapter.

## Seam Discipline

- Do not introduce a port unless at least two adapters are justified,
  usually production and test.
- A deep module can have internal seams used by its own implementation
  and tests. Do not expose internal seams through the external interface
  just because tests use them.

## Testing Strategy

- Write tests at the deepened module's interface.
- Tests assert observable outcomes through the interface, not internal
  state.
- Tests should survive internal refactors.
- Old tests on shallow modules can be deleted once the deeper interface
  tests cover the behavior.
