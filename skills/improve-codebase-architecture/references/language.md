# Language

Shared vocabulary for architecture suggestions. Use these terms consistently.

## Terms

**Module**
Anything with an interface and an implementation. This can be a function, class,
package, or tier-spanning slice.
_Avoid_: unit, component, service.

**Interface**
Everything a caller must know to use the module correctly: type signature,
invariants, ordering constraints, error modes, required configuration, and
performance traits.
_Avoid_: API, signature.

**Implementation**
The code inside a module.

**Depth**
Leverage at the interface. A module is **deep** when a large amount of behavior
sits behind a small interface. A module is **shallow** when the interface is
nearly as complex as the implementation.

**Seam**
A place where behavior can be changed without editing that place. The seam is
where a module's interface lives.
_Avoid_: boundary.

**Adapter**
A concrete thing that satisfies an interface at a seam.

**Leverage**
What callers get from depth: more behavior per unit of interface they must
learn.

**Locality**
What maintainers get from depth: change, bugs, knowledge, and verification
concentrate in one place.

## Principles

- Depth is a property of the interface, not the implementation.
- Deletion test: if deleting a module makes complexity vanish, it was a
  pass-through. If complexity reappears across callers, it was earning its keep.
- The interface is the test surface.
- One adapter means a hypothetical seam. Two adapters means a real seam.

## Relationships

- A **Module** has one **Interface**.
- **Depth** is a property of a **Module**, measured against its **Interface**.
- A **Seam** is where a **Module**'s **Interface** lives.
- An **Adapter** sits at a **Seam** and satisfies the **Interface**.
- **Depth** produces **Leverage** for callers and **Locality** for maintainers.
