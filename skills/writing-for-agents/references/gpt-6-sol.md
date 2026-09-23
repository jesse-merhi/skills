# GPT-6 Sol writing guidance

Official sources: [GPT-6 prompting best practices](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices) and [GPT-6 Sol](https://developers.openai.com/api/docs/models/gpt-6-sol).

Reviewed: 2026-09-23.

OpenAI positions Sol for complex coding and agentic workflows and recommends the family prompting guide. Its observations come from Astra; validate adaptations on Sol before treating them as established Sol behavior.

Keep implementation within its assigned scope and carry it through the required checks and authorized repairs.

Use the shared [writing-for-agents](../SKILL.md) contract. Identical wording is appropriate when it meets the models' needs; do not invent differences or narrow a coordinator's workflow to a worker role.

This repository uses `high` effort for Sol workers. Runtime configuration selects model and effort; editing skill prose changes neither. The model supports `none`, `low`, `medium`, `high`, `xhigh` and `max`. Use the Responses API for reasoning with tools when configuring an API client.
