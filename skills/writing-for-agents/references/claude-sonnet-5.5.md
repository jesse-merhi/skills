# Claude Sonnet 5.5 writing guidance

Official guide: [Prompting Claude Sonnet 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5). Model overview: [Claude Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/overview).

Reviewed: 2026-09-28.

Reuse complete existing Claude prompts when their contract is suitable. Adapt a skill only for a specific workflow or observed behavior; do not add a generic Sonnet prefix. Preserve the base's permissions, verification, review and completion requirements.

- At medium effort, a well-specified agentic coding task can work directly from its assignment. Harder or longer implementation uses high effort. Do not weaken the task's configured effort in prompt text.
- Give the model the intended outcome, owned scope, relevant sources and what counts as done. At medium effort, distinguish real user decisions from routine implementation choices so it completes authorized work without premature check-ins.
- Keep test and documentation work tied to the requested behavior and necessary proof. Do not add supporting documents, extra tests or broad review passes solely because the model offers them, including at xhigh or max effort. Keep the repository's required checks and review gates; at low effort, state required verification explicitly.
- Search current sources for unfamiliar or changeable facts. Ask for concise evidence and conclusions rather than a transcript of private reasoning.
- For visual work, use the available crop or zoom tools when details are too small to inspect. Preserve rendered interaction proof and access boundaries.

API parameters and model migration settings belong to the harness, not individual skill prompts.
