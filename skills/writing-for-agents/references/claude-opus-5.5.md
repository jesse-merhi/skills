# Claude Opus 5.5 writing guidance

Official guide: [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5)

Reviewed: 2026-09-23.

Existing Opus 5 prompts should work without a wholesale rewrite. Make targeted changes when the workflow or observed behavior needs them:

- Bound the requested result, optional investigation, and optional delegation. Opus may otherwise expand a small task. Keep mandated independent workers.
- Set length expectations for saved documents as well as chat. Require useful structure and evidence, and avoid a running narration of routine work.
- Consolidate generic self-check scaffolding into the actual completion criteria. Keep reproduction, regression tests, rendered proof, ownership checks, and explicitly required native/cold review passes.
- During review, collect every genuine scoped candidate before a separate actionability decision. A short final report must not suppress candidate discovery. This separation does not require another worker or review round.
- Keep literal boundaries for diagnosis-only work, publication, destructive changes, and user-owned decisions. General prompting advice never expands those permissions.
- For unattended work, define the completed outcome and genuine blockers. A progress message is not completion. Preserve deliberate human decision stops; do not add blanket continuation loops to interactive workflows.
- Ask for useful progress at meaningful points in long work. If updates are missing, check the harness's display of thinking blocks before adding more prompt instructions.
- Request decisions, evidence and concise explanations, not private reasoning transcripts. Allow agents to revise conclusions when later evidence warrants it.
- Direct the agent to relevant sources and connected apps when the task requires them. For visual work, give concrete design direction; reassess redundant visual scaffolding through an exercise before removing it. Preserve required rendered proof and access boundaries.

Use specific edits to the skill's workflow, not a shared generic prefix on an otherwise untouched prompt. Do not change model effort or tool contracts as a side effect of editing instructions.

For harness integrations, consult the [Opus 5.5 migration notes](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5). Thinking is always adaptive and new evaluations can start at the default medium effort; neither fact overrides the task's configured effort. API compatibility and progress rendering belong to the harness, not to every skill prompt.
