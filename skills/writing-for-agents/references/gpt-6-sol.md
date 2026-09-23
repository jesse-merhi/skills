# GPT-6 Sol writing guidance

Official sources: [GPT-6 prompting best practices](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices) and [GPT-6 Sol](https://developers.openai.com/api/docs/models/gpt-6-sol).

Reviewed: 2026-09-23.

OpenAI recommends the family prompting guidance as a starting point for Sol. Its behavioral observations come from Astra; validate adaptations on Sol rather than claiming those observations establish Sol-specific behavior. Sol is intended for complex coding and agentic workflows.

Adapt the skill's base where these recommendations help its actual work:

- State the authorized outcome and completion evidence. Carry implementation through the checks and repairs already in scope, using repository evidence and reasonable assumptions for routine choices.
- Keep each instruction with its owner and resolve contradictions. An explicit user instruction outranks a skill guideline; preserve required permissions and decisions reserved for the user.
- Put commands, evidence and dependencies beside the step that needs them. Load supporting material when the affected contract calls for it.
- Describe bounded delegation when the workflow requires it. The model guide does not authorize extra workers or change the coordinator's responsibilities.
- Keep conversation and artifacts concise and concrete without dropping uncertainty or required evidence.
- Match verification to the changed behavior and required checks. Repeat or broaden it only when edits, failures or unresolved concerns invalidate the evidence.

Preserve complete workflows, exact commands, domain contracts and approval boundaries. The shared recommendations do not require different wording from another GPT-6 variant when the base already expresses them clearly.

For this repository's implementation workers, preserve `high` reasoning effort. The model supports `none`, `low`, `medium`, `high`, `xhigh`, and `max`; runtime configuration, not skill prose, selects the model and effort. Use the Responses API for reasoning with tools if configuring an API client.
