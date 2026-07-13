# Global Agent Instructions

Shared instructions for every coding agent harness (Claude Code, Codex,
opencode, Pi). Keep this file harness-agnostic: anything Claude-specific
belongs in `CLAUDE.md`, which imports this file and layers on top of it.

## Communication

- When explaining technical concepts, write for an intelligent reader fresh
  out of high school: assume no specialist background, use plain language,
  define necessary jargon, preserve important nuance, and include a concrete
  example when helpful.
- Increase the technical density when the user demonstrates relevant expertise
  or explicitly asks for an expert-level or concise explanation.

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
