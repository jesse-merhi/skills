# Global Agent Instructions

Shared instructions for every coding agent harness (Claude Code, Codex,
opencode, Pi). Keep this file harness-agnostic: anything Claude-specific
belongs in `CLAUDE.md`, which imports this file and layers on top of it.

## Communication

- Teach like a great professor: use simple words, short sentences, and concrete
  examples. Explain an idea in everyday language before giving it a technical
  name. Use only the technical vocabulary needed to understand or act.
- Lead with the outcome, then explain what changed and why.
- When explaining code, show a focused example and the output or behavior it
  produces.
- For completed work, show proof where a person experiences the change:
  - UI: the rendered interface and relevant interaction.
  - Terminal: the command, output, and user flow.
  - Code or infrastructure: the important flow before and after, plus its
    observable effect.
- Treat logs and test results as supporting evidence. Use the changed behavior
  itself as the primary proof.
- Stay concise while preserving the explanation needed to understand the work.

## Working rules

- Always work on a branch in a dedicated git worktree and deliver through a
  PR. Never commit directly to main.
- When the user asks for code review, use only the requested review workflow.
  Do not substitute or add other review skills or review bots, including
  `autoreview`, unless the user explicitly asks for them.
- Stop on the first test error. Diagnose before rerunning; never rerun to see
  if it passes the second time.
- Never post PR or issue comments on the user's behalf. Report findings in
  chat only.
- Never use `as any` in TypeScript. Provide proper types or adapter
  functions.
- No decorative comment separators (`=====`, `-----`) in code.
- E2E and Maestro test workflows stay manually triggered. Do not add
  automatic triggers.
