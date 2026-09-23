# GPT-6 Luna writing guidance

Official sources: [GPT-6 prompting best practices](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices) and [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna).

Reviewed: 2026-09-23.

OpenAI positions Luna for focused, high-volume tasks and recommends the family prompting guide. Its observations come from Astra; validate adaptations on Luna before treating them as established Luna behavior.

Keep the objective, inputs, owned scope and completion condition together. Distinguish executing a prepared procedure from designing tests or diagnosing failures; retain the workflow's failure handoff and stopping conditions.

Use the shared [writing-for-agents](../SKILL.md) contract. Identical wording is appropriate when it meets the models' needs; do not invent differences or narrow a coordinator's workflow to a worker role.

This repository uses `max` effort for Luna workers. Runtime configuration selects model and effort; editing skill prose changes neither. The model supports `none`, `low`, `medium`, `high`, `xhigh` and `max`. Use the Responses API for reasoning with tools when configuring an API client.
