# GPT-6 writing guidance

Use one shared prompt for Astra, Sol (including [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol)) and Luna. OpenAI provides [family-wide prompting guidance](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices) based on Astra observations and no separate Sol or Luna guide; validate it on the consuming models and workload.

Reviewed: 2026-09-29.

- Define the authorized outcome, required evidence and completion conditions. Let the agent resolve routine decisions from context; preserve decisions and permissions that need the user. Astra asks clarifying and non-blocking questions more readily than earlier models, so say which stops the workflow wants and treat implied requests as requests to act.
- Before asking for approval, have the agent finish the authorized work that makes the action concrete, so approval is the last step. Do not add warnings, approval flows or checklists for hypothetical risk.
- Give each rule one owner and resolve conflicting instructions. `AGENTS.md` makes the user's instructions take precedence over skill guidelines and requires quoting the skill instruction behind a pause; do not repeat either rule in skills.
- Ask for concise, concrete language in conversation and saved artifacts. Astra defaults to lists, tables and Markdown; say when paragraphs fit. Remove stock phrases, concluding summary lines such as "In short:", "X, not Y" framing against an alternative nobody raised, and invented compound labels, including in the prompt's own wording and report vocabulary.
- Specify when delegation helps and the worker's boundaries; Astra may delegate less than a workflow wants. Messages between agents may be read by a person, so ask for legible prose. Model guidance grants no authority for extra agents; the applicable AGENTS.md owns roles and effort.
- Run tests suited to the change and complete required checks. Broaden or repeat them only when new changes, failures or unresolved concerns justify it; otherwise continue. Do not add tests for reversible, low-impact changes that mirror the implementation.

Apply the shared [writing-for-agents](../SKILL.md) contract. Keep domain behavior, exact commands, required review and permission boundaries intact. Skill profiles select prompts; launcher configuration selects the model and effort.
