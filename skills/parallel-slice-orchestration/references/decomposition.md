# Decomposition

Build a dependency map before spawning workers:

- shared foundation that must land before parallel work
- slices that can proceed independently
- slices marked `AFK` or `HITL`
- HITL checkpoints that need user/product review before continuing
- files or modules that must not be edited by multiple workers

Use the same map to choose the PR delivery shape before implementation:

- one cohesive review unit becomes one PR
- two or more review units on one strict dependency path become one
  bottom-to-top `gh-stack` stack
- independent paths become standalone PRs or separate stacks

Do not confuse an implementation slice with a PR layer. A vertical slice is a
unit of behavior and may still belong in one larger cohesive PR. A stacked PR
layer exists only when it is independently reviewable and every dependency it
needs is in that layer or below it.

Convert work into vertical slices, not layers. A good slice crosses the real
behavior path: UI to API to persistence, command to side effect, event to stored
state, or equivalent.

Do blocking foundation work locally or assign exactly one worker to it. Do not
parallelize over shared files until the shared shape is stable.

Spawn workers only for independent slices with disjoint write ownership. Keep
the immediate critical-path task local.
