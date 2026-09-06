# Claude global instructions

@AGENTS.md

Everything below is Claude-specific. Do not move it into `AGENTS.md`: Codex
reads that file too.

## Browser work

Use the available Claude Chrome integration for website interaction,
authenticated browser state, screenshots, and browser-driven validation.
Select the intended tab from the integration's current state. If it is
unavailable, report the missing capability; do not install another browser
harness, change authentication, or bypass connection consent.

For UI changes, the implementation owner follows `frontend-ui-validation`.
Review and proof-pack work reuse that evidence rather than starting duplicate
browser sessions.
