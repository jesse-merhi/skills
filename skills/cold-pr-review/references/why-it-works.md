# Why it works

When you implement code and review it yourself, or guide a reviewer with
context, you anchor on your decisions. A reviewer who knows "we decided to
always use --changed" may not question whether that decision is correct. A cold
reviewer encountering the code for the first time evaluates it on its own merits
and catches:

- logical contradictions
- unnecessary dependencies
- implicit assumptions that are not documented
- edge cases the implementer considered and dismissed too quickly

## Common mistakes

| Mistake | Why it matters |
|---------|----------------|
| Including "two reviews already passed" | Primes the reviewer to assume code is good |
| Describing your design rationale | Prevents the reviewer from questioning the design |
| Listing issues you already fixed | Anchors reviewer on those areas, missing new ones |
| Saying "CI is passing" | Signals correctness, reduces scrutiny |
| Reviewing in the same context instead of dispatching a subagent | Preserves the implementer's blind spots |
