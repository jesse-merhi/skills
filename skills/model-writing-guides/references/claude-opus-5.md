# Claude Opus 5 writing guidance

Official guide: [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)

Reviewed: 2026-09-03.

Apply these deltas when writing or maintaining an agent instruction:

- Give the complete task specification up front and let the model carry the
  bounded task through to completion.
- Control response, progress-update, and saved-deliverable length explicitly;
  lowering reasoning effort does not reliably shorten visible writing.
- Ask for one short opening update, then updates only for important discoveries
  or changes in direction, and lead the final response with the outcome.
- Remove legacy instructions to double-check or add a separate verification
  pass. Opus 5 already self-corrects and can over-verify when prompted again.
- Constrain scope expansion and subagent use. Reserve delegation for sizeable,
  independent work and cap it in cost-sensitive workflows.
- Prefer a positive example of the desired communication cadence or style over
  a list of unwanted habits.

These are model compensations, not replacements for the calling skill's shared
contract.
