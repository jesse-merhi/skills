# Unsafe Types

- Do not use `any` without asking the user first.
- Treat `unknown` as boundary data. Validate or narrow it immediately, then
  convert it into a named type before normal app code sees it.
- Avoid non-null assertions. Add the guard or fix the upstream type.
- Avoid `as` casts unless the code has already proved the narrower type.
- Do not add `@ts-ignore` or `@ts-expect-error` unless the user asks, and
  explain why in the comment.
