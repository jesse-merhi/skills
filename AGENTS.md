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

## Dependency-first implementation

Prefer repository-owned or dependency-owned solutions over custom
infrastructure logic.

Before implementing common behavior:

1. Search the repository for an existing utility, module, or established
   pattern.
2. Inspect already-installed dependencies for a native solution. Check the
   installed version and read its current documentation or source.
3. If no installed solution is suitable, assess whether a well-maintained
   external dependency would be safer and simpler than custom code. Do not
   install, replace, or upgrade a dependency without the user's explicit
   permission. Explain the proposed package, why it is needed, and its important
   maintenance, security, licensing, runtime, and bundle-size trade-offs.
4. When selecting an existing or new dependency, search the codebase for other
   custom implementations of the same behavior.
   - Replace them in the current change only when they solve the same problem,
     the replacement is small and low-risk, and relevant tests can prove
     behavior was preserved.
   - Otherwise, report the cleanup candidates and ask before expanding the task
     or PR.
5. Implement custom logic only when the repository and suitable dependencies do
   not meet the requirement. State why the existing options were unsuitable and
   test the important edge cases.

Apply this especially to routing, parsing, validation, serialization, retries,
queues, caching, middleware, request context, telemetry, date and time handling,
resource lifecycle, and graceful shutdown.

## Working rules

- Always work on a branch in a dedicated git worktree and deliver through a
  PR. Never commit directly to main.
- Choose the PR delivery shape before implementation. Keep one cohesive change
  in one PR. When one story contains two or more dependent review units, load
  `gh-stack` and plan a bottom-to-top stack before editing. Keep independent or
  unrelated work in separate PRs or stacks; never invent a dependency merely
  to group changes.
- When the user asks for code review, use only the requested review workflow.
  Do not substitute or add other review skills or review bots, including
  `autoreview`, unless the user explicitly asks for them.
- During code review, compare new custom infrastructure logic with repository,
  runtime, framework, and installed-dependency features. Treat duplicated
  behavior as actionable when it creates competing implementations, semantic
  drift, or missed edge cases.
- Stop on the first test error. Diagnose before rerunning; never rerun to see
  if it passes the second time.
- Never post PR or issue comments on the user's behalf. Report findings in
  chat only.
- Never use `as any` in TypeScript. Provide proper types or adapter
  functions.
- No decorative comment separators (`=====`, `-----`) in code.
- E2E and Maestro test workflows stay manually triggered. Do not add
  automatic triggers.
