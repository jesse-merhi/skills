# Claude global instructions

@AGENTS.md

Everything below is Claude-specific. Do not move it into `AGENTS.md`: Codex
reads that file too.

## Code review routing

Use `codex-reviewer` for requested ad hoc code-centric review. When the user
authorizes `code-review`, use that skill with the Codex engine and preserve its
full gates; an ad hoc review does not replace it. Do not start formal review
merely because implementation ended. Respect an explicit reviewer selection;
report an unavailable selected reviewer rather than silently substituting one.

## Browser work

Use the external `browser-use` skill directly for website interaction,
authenticated browser state, screenshots, and browser-driven validation. It
supports the user's permitted Chrome-family browser, including Chrome and Dia.
When more than one permitted browser is live, select the requested browser
through its `DevToolsActivePort` and `BU_CDP_URL`; never rely on profile scan
order to choose the intended session.
Delegate browser work to the `codex` agent only when a workflow explicitly
requires Computer Use or Browser Use fails its preflight.
