# GPT-6 Luna writing guidance

Official sources: [GPT-6 prompting best practices](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices) and [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna).

Reviewed: 2026-09-23.

OpenAI describes Luna as an efficient model for focused, high-volume tasks and recommends the family prompting guidance as a starting point. That guide reports observations from Astra; validate adaptations on Luna rather than treating them as established Luna-specific behavior.

Adapt the skill's base to make its assignment and evidence easy to follow:

- State the objective, available inputs, owned scope and completion condition together. Resolve routine choices from evidence and existing authorization.
- Keep ordered commands and required evidence at the relevant step. Distinguish executing an established procedure from designing tests, diagnosing failures or changing implementation when the workflow assigns those to another role.
- Preserve the workflow's stopping conditions, permission boundaries and decisions reserved for the user. Report the actual failure, missing input or ambiguity with enough evidence for the coordinator to act.
- Give each rule one owner and resolve conflicting instructions. An explicit user instruction outranks a skill guideline.
- Use concise, concrete results that retain outcomes, evidence and limits. Do not replace useful proof with a status label.
- Run checks needed for the assignment and reuse applicable passing evidence. Model guidance alone does not authorize new checks, retries or additional agents.

Keep the full skill, including exact commands, domain contracts and required review passes. A focused worker role does not authorize weakening a skill or preventing a coordinator from completing its assigned workflow. Identical wording across GPT-6 variants is appropriate where the base already meets the shared recommendations.

For this repository's investigation and test execution workers, preserve `max` reasoning effort. The model supports `none`, `low`, `medium`, `high`, `xhigh`, and `max`; runtime configuration selects it. Use the Responses API for reasoning with tools if configuring an API client.
