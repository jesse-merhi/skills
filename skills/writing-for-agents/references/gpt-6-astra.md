# GPT-6 Astra writing guidance

Official guide: [GPT-6 Astra prompting best practices](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra#prompting-best-practices)

Skill-authoring guidance: [Rethinking skills and prompts for GPT-6 Astra](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)

Reviewed: 2026-09-12.

Adapt instructions where these model behaviors affect the skill:

- Astra can pause for clarification or stop at a first implementation. Define the authorized endpoint, including running, inspecting, and fixing the result when in scope. Tell it which decisions it can resolve from evidence and existing authorization. Preserve genuine human decisions and permission boundaries.
- It is sensitive to conflicting instructions. Give each rule one owner, resolve ambiguity, and make clear that an explicit user instruction outranks a skill guideline. When a skill stops work, identify the exact requirement.
- Specify concise, concrete writing for conversation and saved artifacts. Keep required evidence; omit repeated summaries, stock phrases, and jargon.
- Name required independent work and its boundaries. Do not turn a vendor delegation example into permission for extra agents.
- Make document loading conditional on the task and affected contract. A small text edit need not trigger architecture, database, and deployment reading.
- Bound verification to the changed behavior and required workflow checks. Broaden or repeat checks after a relevant edit, failure, or unresolved concern, not merely to demonstrate diligence.

Apply these changes inside the relevant workflow steps. Keep full prompts, domain contracts, exact commands, and required review passes intact.
