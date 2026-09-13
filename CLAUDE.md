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

## Named workers

Keep the normal main session as coordinator and preserve the user's selected model. When the optional [named workers](claude/README.md) are available, use Claude Code's `Agent` tool with `subagent_type: "implementer"`, `"investigator"`, or `"findings-reviewer"` for a useful bounded assignment. Their native definitions select Fable at high for implementation, Fable at medium for investigation, and Opus at xhigh for independent review; these Claude worker settings replace the shared GPT worker mapping in this harness. Honor explicit user overrides through the launcher and report unavailable settings instead of silently substituting.

The coordinator retains sequencing, integration, validation and delivery. Give each worker the task objective, revision and worktree, owned scope, constraints, acceptance criteria and relevant evidence. Start an independent reviewer fresh, without implementation rationale or prior findings; never use it as an until-clean coordinator or a replacement for the required native review phase.
