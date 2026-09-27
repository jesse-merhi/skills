# GPT-6 writing guidance

Use one shared prompt for Astra, Sol and Luna. OpenAI provides [family-wide prompting guidance](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices) based on Astra observations and no separate Sol or Luna guide; validate it on the consuming models and workload.

Reviewed: 2026-09-27.

- Define the authorized outcome, required evidence and completion conditions. Let the agent resolve routine decisions from context; preserve decisions and permissions that need the user. Astra asks non-blocking questions and stops at offers or plans more readily than earlier models, so say which stops the workflow wants.
- Before asking for approval, have the agent finish the authorized work that makes the action concrete, so approval is the last step. Do not add warnings, approval flows or checklists for hypothetical risk.
- Give each rule one owner. Resolve conflicting instructions and make the user's instructions take precedence over skill guidelines. When a skill makes the agent pause, ask, or depart from the request, have it name the skill file, quote the instruction and say whether it is an explicit requirement or its own reading.
- Ask for concise, concrete language in conversation and saved artifacts. Astra defaults to lists, tables and Markdown; say when paragraphs fit. Remove stock phrases, closing summaries, "X, not Y" framing against an alternative nobody raised, and invented compound labels, including in the prompt's own wording and report vocabulary.
- Specify when delegation helps and the worker's boundaries; Astra may delegate less than a workflow wants. Messages between agents may be read by a person, so ask for legible prose. Model guidance grants no authority for extra agents; the applicable AGENTS.md owns roles and effort.
- Load documents needed for the task and affected contract. Small edits need proportionate investigation. This is repository policy, not OpenAI guidance.
- Run tests suited to the change and complete required checks. Broaden or repeat them only when new changes, failures or unresolved concerns justify it; otherwise continue. Do not add tests for reversible, low-impact changes that mirror the implementation.

Apply the shared [writing-for-agents](../SKILL.md) contract. Keep domain behavior, exact commands, required review and permission boundaries intact. Skill profiles select prompts; launcher configuration selects the model and effort.
