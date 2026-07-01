# Decomposition

Build a dependency map before spawning workers:

- shared foundation that must land before parallel work
- slices that can proceed independently
- slices marked `AFK` or `HITL`
- HITL checkpoints that need user/product review before continuing
- files or modules that must not be edited by multiple workers

Convert work into vertical slices, not layers. A good slice crosses the real
behavior path: UI to API to persistence, command to side effect, event to stored
state, or equivalent.

Do blocking foundation work locally or assign exactly one worker to it. Do not
parallelize over shared files until the shared shape is stable.

Spawn workers only for independent slices with disjoint write ownership. Keep
the immediate critical-path task local.
