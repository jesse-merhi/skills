# Review Checklist

When reviewing a diff, call out code that forces a maintainer to ask:

- What fields are part of this concept, and why?
- Is this local type duplicating something that already exists?
- Should this type be shared because another module depends on it?
- What changes should invalidate this key, snapshot, or derived value?
- Is the helper naming a domain idea, or just hiding code?
- Does a one-use helper do more than forward, convert, or lightly transform the
  caller's value?
- Which real producer, current contract, observed failure, or boundary condition
  can trigger this defensive code?
- Does upstream configuration already make the defended state impossible or
  implausible?
- Can I test the invariant directly, or is it trapped in inline glue?

Prefer concrete rewrites over vague "make this cleaner" comments.

For example, if repository evidence shows an admin-provided connection string
does not contain search parameters, a one-use helper that parses the string,
clears `url.search`, and converts it back to a string adds unsupported defense
and indirection. Recommend removing the query cleanup and passing the configured
value directly. Do not make this finding if the provider supports meaningful
query parameters, the input crosses an untrusted boundary, or current callers
rely on the normalization.
