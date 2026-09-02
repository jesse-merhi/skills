# GPT-5.6 writing guidance

Official guide: [Using GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model)

Reviewed: 2026-09-02.

Apply these deltas when writing or maintaining an agent instruction:

- Keep the prompt lean. State each rule once and remove inherited examples or
  tool descriptions that no longer change behavior.
- Describe the goal, relevant context, hard constraints, required evidence,
  success criteria, and output shape. Let the model choose routine steps.
- Put autonomy and approval boundaries in one compact policy rather than
  repeating caution throughout the workflow.
- GPT-5.6 is concise by default. Preserve required evidence, caveats, and next
  actions before adding broad brevity instructions. Prefer the harness's
  `text.verbosity` control when it is available.
- Define tone through observable writing choices, not labels such as "friendly"
  or "empathetic."

These are model compensations, not replacements for the calling skill's shared
contract.
