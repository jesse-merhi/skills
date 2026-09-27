# Claude Opus 5.5 writing guidance

Official guide: [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5). Claude Code usage: [Getting the most out of Opus 5.5](https://claude.dev/blog/getting-the-most-out-of-opus-5-5/).

Reviewed: 2026-09-27.

Opus variants began as Opus 5 prompts, which Anthropic calls a reasonable starting point for Opus 5.5. The Opus 5.5 guide no longer describes the behavior behind their compensations (scope bounding, delegation caps, document-length limits and narration limits). Remove one when it duplicates a rule owned elsewhere or an exercise shows it is unnecessary; keep it where it states the skill's own contract. Make targeted changes when the workflow or observed behavior needs them:

- Remove instructions to think carefully, step by step, harder or less. Thinking is always on and effort sets its depth. Remove ritual steps that are not completion criteria, such as scratchpads and verify-twice rules. Keep reproduction, regression tests, rendered proof, ownership checks and required review passes.
- Request decisions, evidence and concise explanations, never a transcript of private reasoning; Opus 5.5 can refuse such requests as reasoning extraction. Allow agents to revise conclusions when later evidence warrants it.
- Define what done means and name the stops the workflow wants. Opus 5.5 follows instructions that name the unwanted ones: a summary that announces the next step without taking it, an offer to continue, choices that do not block the work, or pausing at a milestone to report. `AGENTS.md` owns the general rule; keep deliberate human decision points.
- Say when updates are wanted, such as a line before starting and a short recap at the end. Add narration or length limits only where an exercise shows padding. If updates are missing, check the harness's display of thinking blocks before adding prompt text.
- On loosely specified work, name the sources, files or connected apps to read before acting; Opus 5.5 tends to start quickly.
- During review, collect every genuine scoped candidate before a separate actionability decision. This repository's review workflow depends on that separation; it does not require another worker or review round.
- For frontend or visual design, name the specific default patterns to avoid rather than asking for a less generic look, then check which styles the first result used in their place and add unwanted ones to the list. Reassess visual-reading scaffolding through an exercise before removing it; keep image tools, required rendered proof and access boundaries.
- Keep literal boundaries for diagnosis-only work, publication, destructive changes and user-owned decisions. General prompting advice never expands those permissions.

Use specific edits to the skill's workflow, not a shared generic prefix on an otherwise untouched prompt. Do not change model effort or tool contracts as a side effect of editing instructions.

For harness integrations, consult the [Opus 5.5 migration guide](https://platform.claude.com/docs/en/models/opus-5-5/migration-guide). Thinking is always adaptive and new evaluations can start at the default medium effort; neither fact overrides the task's configured effort. API compatibility and progress rendering belong to the harness, not to every skill prompt.
