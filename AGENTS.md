# Global agent instructions

Edit shared instructions for Claude Code, Codex, opencode, Pi, Antigravity and Cursor here. Harness-specific rules have their own headings.

## Communication

Jesse reads the final reply on its own. Open with the outcome in a sentence or two. Use plain words and recognizable names. Explain necessary technical terms. Follow `speak-fking-english` for longer writing.

- Show each visible or runnable change after the opening as **A · Before** beside **B · After**, or stacked in text. A new screen or file stands alone.
  - For screens, show and caption screenshots of the same view. Add a [show-video](skills/show-video/SKILL.md) recording for flow or motion.
  - For added, removed or moved components, caches, queues or services, render an A/B [diagram](skills/design-technical-diagrams/SKILL.md). Skip ASCII art.
  - For code, show the actual lines. Skip diff notation.
  - For commands and APIs, show the actual command or request and its output as text.
- Render visuals in chat without hosting or uploading. Prefer HTML, else embed by absolute path. In T3 Code, send the opening with `send_to_user`, check the page with `html_preview`, then use `html_render` above the final reply. Inspect every capture and the finished page. If you can't show it, say why and link the local file.
- Use text for answers, assessments and text-only requests. Workers give proof to the coordinator to show Jesse.
- Separate verified and untested results. Omit hashes, receipt paths and internal IDs Jesse doesn't need.
- For multi-step or release work, report actual merge, staging or preview, production or OTA status as applicable and any remaining manual steps.
- Ask only when evidence, safe investigation or a low-risk assumption can't settle it. Use the harness's synchronous tool when available. In Codex, use `request_user_input`. Never use `request_user_input_async`. Otherwise ask in the final reply.

## Check-ins

Show the PR or file, change, proof, open concerns, recommendation and next step. Keep working on independent steps. Proceed on Jesse's yes in chat.

Check in before:

- Merging or submitting to a merge queue.
- Adding, replacing or upgrading a dependency. Explain the package, need, maintenance, security, licensing, runtime and bundle-size trade-offs.
- A breaking change or a temporary stopgap. Explain what breaks and how to migrate, or the durable alternative.
- Destructive or hard-to-undo work, such as deleting data, unique commits or stashes, force-pushing or editing outside the task's repo.
- Publication the task didn't authorize, paid services, manual CI runs the task didn't authorize or posting in Jesse's name.

State routine choices such as PR shape, stack layout, ticket breakdown and design in an update and proceed. Passwords, passkeys, two-factor codes and payment confirmation stay with Jesse.

## Coding standards

Before implementing or reviewing code, read `coding-standards` in **Read expectations** mode. Use the source given in the task, else `skills/coding-standards/SKILL.md` in this repo when working here, else the installed skill. Follow its principles and recorded project exceptions.

## Implementation design

- On turn one, before promising live proof or starting broad edits, check the relevant prerequisites in the actual worktree, including model and account capacity, local dependencies, profiling and test commands, browser or device control, and native or store release impact. Resolve safe local blockers and report shared-host blockers immediately.
- Identify the requested outcome, changed behavior and owner. Use callers, tests, docs and history to establish the contract. Trace the full flow across ownership, lifecycle, security or data boundaries.
- Capture the baseline before editing when before-and-after screenshots or video would help.
- Choose the simplest implementation that meets the requirement. Skip speculative abstractions, configuration and compatibility layers. Keep the diff as small as the requirement allows. Remove unneeded code, tests and docs before review and report net lines added and removed.
- Read `writing-for-agents` before creating or changing agent instructions.

## Dependency-first implementation

Before writing infrastructure for parsing, validation, serialization, retries, queues, caching, middleware, telemetry, time or resource lifecycle, look for a repo utility, then a native feature in an installed dependency at its installed version. If neither fits, explain why before writing custom logic. Check in for a new dependency. List other custom copies as follow-ups unless replacing them is small and testable.

## Test and review design

- Read `writing-good-tests` before implementing code, even with no planned test edits, before changing tests or test infrastructure, and when reviewing behavior or tests. Choose proof of caller-visible results and reachable failures. Add tests only when justified.
- Run tests for changed behavior, a concrete failure or a required check. Reuse passing results while their inputs still apply. A commit, rebase or metadata-only edit alone doesn't justify unrelated reruns. Stop at the first error and diagnose before rerunning. Never rerun to see whether it passes the second time.
- Limit test cleanup to changed behavior. During code review, apply code-review's readability rules to the diff and proposed fixes. Compare custom infrastructure with repo, runtime and dependency features.
- Before a review fix, meet code-review's evidence requirements. A real-app reproduction with realistic local fixtures qualifies. Type-permitted or invented unreachable states don't. Never access production or cause an incident to gather proof.

## Model turns

- Cap effort at `high` for Gemini 4 Neon, Claude Fable 5.2, Claude Opus 5.5 and Claude Sonnet 5.5, and at `xhigh` for GPT-6.2 Astra and GPT-6.2 Sol. Never use `max`, `ultra` or `ultrathink`; other models stay below them. Defaults, briefs, skills and other agents can't exceed the caps.
- Keep fast mode off (Claude and Cursor `fastMode`, Codex `priority` or `ultrafast` tiers, `/fast`) unless Jesse asks for it on that task.
- Default to GPT-6.2 Sol at high for coordination, test design, debugging and reviews outside `code-review`. Use GPT-6 Luna at high for established tests, lint, type checks, prepared validation and bounded retrieval such as `session-recall` and `skill-cleaner` inventories. See [Claude Code defaults](#named-workers).
- If the host explicitly forbids delegating a small review fix, as T3 does, apply it directly and disclose it. Otherwise, Claude and Gemini coordinators delegate every implementation edit, including small edits, tests, docs, simplification and review fixes. Use the first available implementer in order: GPT-6.2 Sol (`xhigh`), Gemini 4 Neon (`high`), Claude Opus 5.5 (`high`), GPT-6.2 Astra (`xhigh`), Claude Sonnet 5.5 (`high`), Claude Fable 5.2 (`high`). Follow the [implementation handoff](skills/code-review/references/codex-implementation.md). Skip models ruled out by launcher, model, account, subscription or spend cap without asking. Report the model used and why earlier ones were skipped in the final reply. The coordinator plans, investigates, sequences, reviews the diff, verifies independently and delivers. If no implementer can start, report the blocker and leave the edit pending.
- Codex coordinators may implement directly or delegate within task and skill limits. Follow the same implementer order. Give workers a bounded task and completion condition. The coordinator keeps sequencing, integration and delivery.
- When delegating to Codex from any harness, including Codex on another connection, verify ChatGPT sign-in before launching and ask Jesse before using an API-key connection.
- In T3 Code, use `orchestrator_capabilities` to pick an enabled provider, model ID and effort option (`reasoningEffort` on Codex; `effort` on Claude; High thinking on Antigravity; `reasoning_effort` for Gemini 4 Neon and Claude Sonnet 5.5, and `effort` for Claude Opus 5.5 and Fable 5.2, on Cursor). Use Cursor for Gemini 4 Neon when Antigravity is unavailable, and for Claude Opus 5.5, Sonnet 5.5 or Fable 5.2 when a Claude provider is unavailable; keep fast mode off.
- For an unresolved decision, prefer read-only GPT-6.2 Astra at high. Use Claude Fable 5.2 at high for harder decisions that warrant the cost or as the native Claude `oracle`. Give one question, revision, evidence and constraints. The coordinator decides. `code-review` owns its review modes and council.
- Findings-only reviewers report supported findings, evidence, concerns and verification limits. They don't edit, manage fixes, capture new proof, publish or run handoffs. Give fresh reviewers the target, requirements and proof without implementation rationale or prior findings. The coordinator confirms and prioritizes findings. Skills can't expand an assignment.
- Apply Jesse's explicit model or effort override in the launcher for that task only, within the caps. Report an unavailable override without substituting.
- Batch independent calls with bounded output (`Promise.allSettled` in Codex code mode). Read all required text and recover clipped sections. Keep dependent calls and writes serial.
- Use `wait-efficiently` for agents, CI, long commands and timed delays.

## Outcome and completion

- Infer the outcome from the request and later corrections. Build or fix requests authorize local implementation and verification. Questions and problem descriptions alone call for an assessment.
- Set a concrete done condition before open-ended work. Finish all authorized steps before stopping at that condition. A plan, diagnosis, partial patch or offer to continue falls short. Pause only for a real blocker or required check-in.
- Check the result against the request and corrections. Show proof and report anything unfinished with the evidence and blocker. List further polish as optional.

## Working rules

- Avoid forced deletion (`rm -f`, `rm -rf`, `--force`) in routine cleanup. Use plain `rm` for verified disposable files and `rmdir` for empty directories. Inspect any blocked target and error before retrying.
- Load only skills relevant to the action and artifact. Jesse's explicit instructions take precedence. If a skill makes you pause, ask or depart from the request, name it and quote the rule.
- Work on a branch in a dedicated git worktree. Never push agent-authored commits to the default branch.
- Push, open or update a PR only when requested or authorized by a workflow such as `just-do-it`. Otherwise show a local checkpoint. Use `pr-proof-pack` after pushing finished work.
- Use one PR per story and follow up in that PR. Use installed `gh stack` (see `gh stack --help`) only for two or more genuinely dependent review units.
- Before marking ready or merging, get `code-review` on the current changes unless Jesse waived it. Check in with findings and fixes, proof and CI state.
- Merge through the provider's protected flow. For a GitHub merge queue, after check-in, submit with `gh pr merge <pr-url> --match-head-commit <reviewed-head>` and confirm queue membership and eventual merge through GitHub. Never bypass protections or required checks.
- During review, use only the requested workflow and required lenses. Run review bots such as OpenClaw `$autoreview` only with Jesse's opt-in for this task.
- Don't post prose PR or issue comments for Jesse. The only exception is a machine command a named workflow requires on a PR Jesse authored or substantially contributed to, such as `/clawsweeper re-review`.
- Never use `as any` in TypeScript. Write types or adapters. Skip decorative comment separators such as rows of equals signs or dashes. E2E and Maestro workflows stay manually triggered.

## Effect code

Read all of `node_modules/effect/AGENTS.md` before writing or changing Effect code. Check APIs against installed source, including prerelease `effect/unstable/*` modules.

## Browser work in T3 Code

When `preview_*` is available, use it for work that doesn't need Jesse, such as local servers or public pages. Use Jesse's Dia browser for his accounts, sign-in, passkeys, two-factor codes, CAPTCHA and flows he wants to watch or take over.

- In Dia, use the harness's browser extension. Codex uses its browser integration. Claude uses `mcp__chrome__*` under T3 and `mcp__claude-in-chrome__*` elsewhere. Read `anthropic-skills:chrome-browser` before the first Claude extension call. See [setup](claude/README.md#claude-extension-under-t3). If a site asks for permission, ask Jesse to click Allow, then retry.
- If the extension is unavailable, use `dia` MCP tools. Dia asks Jesse to approve each new connection. Keep one server for the session without restarting, running a second or reconnecting per task.
- Open a new Dia tab and leave his other tabs alone. At a password, passkey, two-factor or payment step, tell Jesse what to do in Dia and wait for his confirmation.
- If both routes fail, report which failed and why. Keep the task in Dia and that profile.

## Claude Code

### Browser work

Follow [T3 browser rules](#browser-work-in-t3-code) in T3. Elsewhere, use Claude Chrome for websites, signed-in state, screenshots and browser validation. If unavailable, report the blocker. Don't install another browser harness, change authentication or bypass connection consent. The UI implementer follows `frontend-ui-validation` and reviewers and proof-pack authors reuse its evidence.

### Named workers

Follow the [Claude defaults and named-worker model table](claude/README.md). For installed roles, use `Agent` with the matching `subagent_type`, model and effort per call. Give workers the original task or exact quoted requirements and verify their results. Give a read-only worker a concrete check if it falls short, and consult the oracle if a decision still needs judgment. Route edits through [Model turns](#model-turns).
