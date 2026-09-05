# Claude global instructions

@AGENTS.md

Everything below is Claude-specific. Do not move it into `AGENTS.md`: Codex
reads that file too.

## Browser work

Use the external `browser-use` skill directly for website interaction,
authenticated browser state, screenshots, and browser-driven validation. It
supports the user's permitted Chrome-family browser, including Chrome and Dia.
When more than one permitted browser is live, select the requested browser
through its `DevToolsActivePort` and `BU_CDP_URL`; never rely on profile scan
order to choose the intended session.
Delegate browser work to the `codex` agent only when a workflow explicitly
requires Computer Use or Browser Use fails its preflight.
