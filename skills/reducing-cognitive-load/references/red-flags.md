# Red Flags

- Anonymous string protocols such as delimiter-joined snapshot keys, cache keys,
  sync keys, or audit keys.
- Long inline `map` / `filter` / `reduce` chains that encode domain rules inside
  formatting code.
- Local types that duplicate an existing exported type with a different name or
  subtly different optional fields.
- Types declared beside one file's implementation even though they are part of a
  contract used elsewhere.
- Positional arrays or tuple-ish strings where the order and meaning of fields
  must be memorized.
- Boolean or optional-field soup instead of a named state or discriminated
  union.
- Helper functions that merely hide one expression without naming a real
  concept, invariant, boundary, or test seam.
- Generic helpers introduced before there are multiple real call sites.
- Guards, fallbacks, normalization, or sanitization for states with no plausible
  producer, documented contract, observed failure, or boundary condition.
