# Claude Opus 5 writing guidance

Official guide: [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)

Reviewed: 2026-09-05.

Adapt instructions where these model behaviors affect the skill:

- Bound the requested result, optional investigation, and optional delegation.
  Opus may otherwise expand a small task. Keep mandated independent workers.
- Set length expectations for saved documents as well as chat. Require useful
  structure and evidence, and avoid a running narration of routine work.
- Consolidate generic self-check scaffolding into the actual completion
  criteria. Keep reproduction, regression tests, rendered proof, ownership
  checks, and explicitly required native/cold review passes.
- During review, collect every genuine scoped candidate before a separate
  actionability decision. A short final report must not suppress candidate
  discovery. This separation does not require another worker or review round.
- Keep literal boundaries for diagnosis-only work, publication, destructive
  changes, and user-owned decisions. General prompting advice never expands
  those permissions.

Use specific edits to the skill's workflow, not a shared generic prefix on an
otherwise untouched prompt. Do not change model effort or tool contracts as a
side effect of editing instructions.
