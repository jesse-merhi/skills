# Review Checklist

When reviewing a diff, call out code that forces a maintainer to ask:

- What fields are part of this concept, and why?
- Is this local type duplicating something that already exists?
- Should this type be shared because another module depends on it?
- What changes should invalidate this key, snapshot, or derived value?
- Is the helper naming a domain idea, or just hiding code?
- Can I test the invariant directly, or is it trapped in inline glue?

Prefer concrete rewrites over vague "make this cleaner" comments.
