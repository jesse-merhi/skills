# Feedback Loop

Find or create the fastest deterministic feedback loop:

- failing unit/integration/e2e test
- exact command that reproduces the failure
- log query or minimal manual flow when tests are unavailable

Instrument surgically:

- add temporary logs only where they answer a specific question
- prefer assertions, traces, focused tests, and small command output
- remove temporary instrumentation before completion
