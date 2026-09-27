# Claude Fable 5.1 writing guidance

Official guide: [Prompting Claude Fable 5.1](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1)

Reviewed: 2026-09-27.

Apply these deltas when writing or maintaining an agent instruction:

- Ask for brief progress updates when a long tool run would otherwise go silent, and a closing recap that stands on its own. Remove lines that hold all findings for the final response before adding more. If updates still look missing, check that the harness displays them.
- Ask for independent tool calls to be batched when the harness pays per turn.
- Tell the model to finish the whole authorized task when it tends to describe the next step or ask again for permission already granted. When the user describes a problem or asks a question, the assessment is the deliverable; do not turn that exception into a fix.
- Remove instructions to think carefully, step by step, harder or less; thinking is always on and effort sets its depth. Request decisions and explanations, never a transcript of private reasoning.
- Counter dense or mannered prose directly. Prefer literal wording, shorter sentences, and paragraph breaks over metaphor or flourish.
- Do not carry forward blanket anti-formatting rules. Ask for structure when it helps a multifaceted answer and plain prose when it does not.
- Require retrieved wording to be marked as quotation when that distinction matters.
- Bound extra scope, tests, and whole-file rewrites: report unrequested fixes as follow-ups while implementing every requested behavior completely. At low effort, explicitly require search for current or unfamiliar facts.
- When a skill writes a summary for a fresh context, such as a handoff, list what it must keep: problems and their resolutions, options tried or set aside and why, decisions and constraints stated exactly, current state, open items, and exact names, numbers and wording.
- Prefer targeted edits for small and medium changes. Keep conversation history append-only when the harness replays Fable thinking blocks.

These are model compensations, not replacements for the calling skill's shared contract.
