# GPT-6 writing guidance

Use one shared prompt for Astra, Sol and Luna. OpenAI provides [family-wide prompting guidance](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices) based on Astra observations; validate it on the consuming models and workload.

Reviewed: 2026-09-23.

- Define the authorized outcome, required evidence and completion conditions. Let the agent resolve routine decisions from context; preserve decisions and permissions that need the user.
- Give each rule one owner. Resolve conflicting instructions and make the user's instructions take precedence over skill guidelines. Identify the exact requirement when a skill stops work.
- Ask for concise, concrete language in conversation and saved artifacts. Preserve useful evidence; remove stock phrases, repeated summaries and jargon.
- Specify when delegation helps and the worker's boundaries. Model guidance grants no authority for extra agents; the applicable AGENTS.md owns roles and effort.
- Load documents needed for the task and affected contract. Small edits need proportionate investigation.
- Verify changed behavior and required checks. Broaden or repeat checks after relevant changes, failures or unresolved concerns.

Apply the shared [writing-for-agents](../SKILL.md) contract. Keep domain behavior, exact commands, required review and permission boundaries intact. Skill profiles select prompts; launcher configuration selects the model and effort.
