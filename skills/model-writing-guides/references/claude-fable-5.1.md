# Claude Fable 5.1 writing guidance

Official guide: [Prompting Claude Fable 5.1](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1)

Reviewed: 2026-09-03.

Apply these deltas when writing or maintaining an agent instruction:

- Ask for brief progress updates when a long tool run would otherwise go
  silent, and ask for independent tool calls to be batched when the harness
  pays per turn.
- Tell the model to finish the whole authorized task when it tends to describe
  the next step or ask again for permission already granted.
- Counter dense or mannered prose directly. Prefer literal wording, shorter
  sentences, and paragraph breaks over metaphor or flourish.
- Do not carry forward blanket anti-formatting rules. Ask for structure when it
  helps a multifaceted answer and plain prose when it does not.
- Require retrieved wording to be marked as quotation when that distinction
  matters.
- Bound extra scope, tests, and whole-file rewrites. At low effort, explicitly
  require search for current or unfamiliar facts.
- Prefer targeted edits for small and medium changes. Keep conversation history
  append-only when the harness replays Fable thinking blocks.

These are model compensations, not replacements for the calling skill's shared
contract.
