# GPT-6 Astra writing guidance

Official guide: [GPT-6 Astra prompting best practices](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra#prompting-best-practices)

Reviewed: 2026-09-06.

Adapt instructions where these model behaviors affect the skill:

- Astra can pause for clarification when the task already supplies enough direction. Tell it which decisions it can resolve from evidence and existing authorization. Preserve genuine human decisions and permission boundaries.
- It is sensitive to conflicting instructions. Give each rule one owner, resolve ambiguity, and make clear that an explicit user instruction outranks a skill guideline. When a skill stops work, identify the exact requirement.
- Specify concise, concrete writing for conversation and saved artifacts. Keep required evidence; omit repeated summaries, stock phrases, and jargon.
- Name required independent work and its boundaries. Do not turn a vendor delegation example into permission for extra agents.
- Bound verification to the changed behavior and required workflow checks. Broaden or repeat checks after a relevant edit, failure, or unresolved concern, not merely to demonstrate diligence.

Apply these changes inside the relevant workflow steps. Keep full prompts, domain contracts, exact commands, and required review passes intact.
