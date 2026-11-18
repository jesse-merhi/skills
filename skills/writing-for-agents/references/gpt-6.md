# GPT-6 writing guidance

GPT-6.2 Astra and Sol share this repository’s GPT-6 prompt with Luna. OpenAI’s 6.2 examples draw on Astra and Sol. Try a prompt change on the model and task where the behavior matters. [OpenAI’s GPT-6.2 prompting guide](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6.2-astra#gpt-6.2-astra-prompting-best-practices) (reviewed 2026-11-18).

## Writing for the reader

Astra already writes briefly and directly. Revisit repeated requests to “be concise” when they cause the model to omit context. Name the reader, what they need to know or do, and any terminology worth preserving. If users can see messages between agents, write briefs and progress updates in terms they can follow.

For a final answer, assume the reader missed the progress updates. Give the outcome and enough evidence to understand it on its own. Translate shorthand from tools and other agents into the user’s terms. In an external draft, supply background the recipient lacks. When editing someone’s text, preserve their wording outside the requested change.

## Completing the work

State the outcome, how to verify it, and which decisions belong to the user. Astra can propose a next step and wait when a detail is unclear. For a routine, reversible choice, let it state its assumption and finish the authorized work. When approval is required, finish the authorized preparation first so the user can decide from the evidence. Keep check-ins and delegation policy in the applicable `AGENTS.md` and avoid adding approval steps for hypothetical risks.

For coding tasks, point to the conventions and caller behavior that matter. Name a regression the existing checks could miss when asking for a new test. For a visual brief, specify the reference, imagery and typography that define the intended look, then judge the rendered result. Keep interface text that helps someone understand the screen or take an action.
