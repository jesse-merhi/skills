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

Keep the normal main session as coordinator and preserve the user's selected model. When the optional [named workers](claude/README.md) are available, assign one `implementer` as execution owner for a cohesive change. Use `investigator` and `findings-reviewer` only for useful bounded assignments. Their native definitions select Fable at high for execution, Fable at medium for investigation, and Opus at xhigh for independent review; these Claude worker settings replace the shared GPT worker mapping in this harness. Honor explicit user overrides through the launcher and report unavailable settings instead of silently substituting.

The main coordinator retains planning, user communication and code-review judgment. It also dispatches the independent reviewer because the execution owner cannot use `Agent`. The execution owner retains sequencing, integration, validation, review-record mechanics, commits and authorized delivery. Give each worker the task objective, revision and worktree, owned scope, constraints, acceptance criteria and relevant evidence. Start an independent reviewer fresh, without implementation rationale or prior findings; never use it as an until-clean coordinator or a replacement for the required native review phase.
