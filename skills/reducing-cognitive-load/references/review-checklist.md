# Review Checklist

When reviewing a diff, call out code that forces a maintainer to ask:

- What fields are part of this concept, and why?
- Is this local type duplicating something that already exists?
- Should this type be shared because another module depends on it?
- What changes should invalidate this key, snapshot, or derived value?
- Is the helper naming a domain idea, or just hiding code?
- Can I test the invariant directly, or is it trapped in inline glue?

Prefer concrete rewrites over vague "make this cleaner" comments.

## Plausibility Test

For each changed guard, fallback, normalization, or sanitization, identify a
current producer, contract, observed failure, or boundary condition that can
plausibly trigger it. Report the code when no such evidence exists and removing
it preserves current behavior. "Just in case" is not evidence.

## Proxy Test

Report a one-use helper that only forwards, converts, or lightly transforms a
value when inlining it preserves behavior and makes the caller easier to read.
Keep the helper when it names a domain concept, preserves a boundary or
dependency direction, handles expected variability, or creates a useful test
seam. A hypothetical future call site is not duplication.

If a proxy helper exists only to defend an implausible state, recommend removing
the defense before inlining the remaining work.

## Example

For example, if repository evidence shows an admin-provided connection string
does not contain search parameters, a one-use helper that parses the string,
clears `url.search`, and converts it back to a string adds unsupported defense
and indirection. Recommend removing the query cleanup and passing the configured
value directly. Preserve the helper when the provider supports meaningful query
parameters, the input crosses an untrusted boundary, or current callers rely on
the normalization.
