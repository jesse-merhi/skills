# Slice Shape

A good first slice crosses the real boundary of the feature:

- UI to API to persistence
- command to filesystem effect
- parser input to normalized output
- webhook/event to stored state

It may be narrow, but it should prove the route through the system.

Avoid:

- layer-only tasks such as "add schema", "add endpoint", or "add UI" unless
  they are part of the current passing slice
- broad test inventories before implementation
- mocking the behavior that the slice is supposed to prove
- refactors before a failing test makes the need concrete
