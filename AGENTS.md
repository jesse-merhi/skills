# Global agent instructions

These instructions apply to every coding harness (Claude Code, Codex, opencode, Pi). Harness-specific rules sit under their harness's heading. Edit instructions here.

## Communication

Jesse reads your final reply without having seen your progress updates, tool calls or files, and he judges work by looking at it.

- Open with what happened in a sentence or two. Use plain words throughout, explain any technical term you can't avoid, and call things you named during the work by what they are. Follow `speak-fking-english` for longer writing.
- When you changed something he can see or run, show it in the chat after that opening instead of describing it. Show each change as **A · Before** beside **B · After** (or A above B in plain text); only a brand-new screen or file stands alone.
  - Screens: screenshots of the same view, captioned with what to look for. Add a [show-video](skills/show-video/SKILL.md) recording when the change is a flow or motion.
  - Structure, meaning a component, cache, queue or service added, removed or moved: a rendered A/B diagram from `design-technical-diagrams`, not ASCII art.
  - Code: the real changed lines, A/B, not a diff or a description.
  - Commands and APIs: the real command or request and its output, as text.
- Render visuals in the chat, not as a hosted link or upload: an HTML page when the host supports one, otherwise an embedded image with an absolute path. In T3 Code the page appears above the final reply, so send the opening with `send_to_user`, check the page with `html_preview`, then call `html_render`. Look at every capture and the finished page before you include them. If you can't show something, say so and link the local file.
- Answers, assessments and text-only requests get text. Workers return their evidence to the coordinator, who shows it to Jesse.
- Keep proven results apart from untested ones. Leave out hashes, receipt paths and internal identifiers unless he needs them.
- Ask only when evidence, safe investigation or a reasonable low-risk assumption can't settle the question. Use the harness's synchronous question tool when it has one. In Codex, that is `request_user_input`, not `request_user_input_async`. Otherwise, ask in the final response.

## Check-ins

Jesse reviews work by looking at it, not by clicking gates. When something below needs his decision, check in: say what to look at (PR or file link, what changed, the proof, open concerns) and what you plan to do next, with your recommendation. Keep going with work that doesn't depend on the answer. Proceed when he says yes in chat. A 👍 on the PR also counts, but don't poll for one or ask him to add it.

Check in before:

- merging or submitting to a merge queue;
- adding, replacing or upgrading a dependency (explain the package, why it's needed and its maintenance, security, licensing, runtime and bundle-size trade-offs);
- a breaking change (explain what breaks and the migration path) or a stopgap meant to be replaced later (explain the durable alternative);
- anything destructive or hard to undo: deleting data, unique commits or stashes, force-pushing, or changing files outside the task's repository;
- publishing work the task didn't ask to publish (see Working rules);
- paid services, or manually triggered CI runs the task didn't already authorize;
- posting anything on GitHub or elsewhere in Jesse's name.

Everything else, such as PR shape, stack layout, ticket breakdowns and routine design choices, is yours: state the choice in your update and proceed. Passwords, passkeys, two-factor codes and payment confirmation always stay with Jesse.

## Coding standards

Before implementing or reviewing code, read `coding-standards` in its **Read expectations** mode: the source supplied in the task, else this repository's `skills/coding-standards/SKILL.md` when working here, else the installed skill. Follow its principles and the project's recorded exceptions.

## Implementation design

- Start from the requested outcome, the changed behavior and its owner. Read callers, tests, docs and history as needed to establish the contract. Trace complete flows when a change crosses ownership, lifecycle, security or data boundaries.
- Before implementing changed behavior, use `writing-good-tests` to choose the proof of the caller-visible result and its reachable failures. When before-and-after screenshots or video would help, capture the baseline before editing.
- Choose the simplest implementation that fully meets the current requirements, without speculative abstractions, configuration or compatibility layers.
- Keep the diff as small as the requirement allows. Before review, remove code, tests and docs the requirement doesn't need, and report net lines added and removed.
- Before creating or changing agent instructions, use `writing-for-agents`.

## Dependency-first implementation

Before writing custom infrastructure (parsing, validation, serialization, retries, queues, caching, middleware, telemetry, dates and times, resource lifecycle), look for an existing repository utility, then a native feature of an installed dependency at its installed version. If neither fits, say why before writing custom logic; a new dependency needs a check-in. List other custom copies of the same behavior as follow-ups unless replacing them is small and provable by tests.

## Test and review design

- Load `writing-good-tests` before implementing code (even with no planned test changes), before changing tests or test infrastructure, and when reviewing behavior or test changes. A coding task doesn't automatically need new tests.
- Run tests to verify changed behavior, investigate a concrete failure or satisfy a required check. Reuse passing results while their inputs still apply; a new commit, rebase or metadata-only edit alone doesn't justify rerunning unrelated suites.
- Stop on the first test error. Diagnose before rerunning; never rerun to see whether it passes the second time.
- Keep test cleanup tied to the changed behavior. Touching a test file doesn't require reorganizing it.
- During code review, apply code-review's readability rules to the diff and to every proposed fix, and compare new custom infrastructure with existing repository, runtime and dependency features.
- Before repairing a review finding, meet code-review's evidence requirements. A reproduction through the real application with realistic local fixtures qualifies; a type-permitted or invented unreachable state doesn't. Gathering evidence never justifies production access or causing an incident.

## Model turns

- Default models: GPT-6.2 Sol at high for coordination, test design, debugging and reviews outside `code-review`; GPT-6 Luna at high for running established tests, lint, typecheck and prepared validation, and for bounded retrieval such as `session-recall` and `skill-cleaner` inventories. The [Claude Code mapping](#named-workers) sets native Claude Code defaults.
- Claude and Gemini coordinators assign every implementation edit to GPT-6.2 Sol at `xhigh`, including small changes, tests, documentation, simplification and review fixes. They plan, investigate, sequence work, review results, run checks and deliver. If Sol is unavailable or the host bars delegation of an edit, such as T3 Code's small review-fix rule, leave the edit pending and report the blocker.
- In T3 Code, use a Codex connection verified as signed in with ChatGPT in the provider settings. Use `orchestrator_capabilities` for the instance ID, model and effort. A display name alone does not verify sign-in. Pass the instance as `target.providerInstanceId` to `delegate_task` with `role: "implementation"`, `target.model: "gpt-6.2-sol"` and `target.options: [{id: "reasoningEffort", value: "xhigh"}]`. Outside T3, use the [Codex CLI with ChatGPT sign-in](claude/README.md#implementation-through-codex). If sign-in cannot be verified, report it. Ask Jesse before using an API-key connection.
- Give Sol the goal, owned files, constraints and acceptance checks. Let it choose how to implement the change. Inspect the returned diff against the request and independently verify the result before signing off. Send any further edits back to Sol.
- Codex coordinators can implement directly or use subagents at their discretion, following the task and applicable skills. Use GPT-6.2 Sol at `xhigh` for the named implementer role. Give each worker a bounded task and completion condition, and keep sequencing, integration and delivery with the coordinator.
- For an unresolved decision that merits a second opinion, prefer GPT-6.2 Astra at high as the lower-cost read-only oracle. Use Claude Fable 5.2 at high for a harder decision that warrants its cost or when using the native Claude `oracle` role. Give one question, the revision, evidence and constraints. The oracle advises and the coordinator decides. `code-review` owns its reviewer council.
- Findings-only reviewers inspect and report supported findings, evidence, unresolved concerns and verification limits. They don't edit, manage repairs, capture new proof, publish or run handoffs; the coordinator confirms findings and decides their priority. Give fresh reviewers the target, requirements and available proof without implementation rationale or prior findings. Reading a skill doesn't expand an agent's assignment.
- Apply an explicit user model or effort override only to its named task, set through the launcher. If that configuration is unavailable, say so rather than substituting.
- Batch independent calls but bound their combined output. Read every part of required documents; truncation is not a completed read. In Codex, use `Promise.allSettled` in code mode for independent reads. Keep dependent calls and writes serial.
- Use `wait-efficiently` for pending agents, CI, long-running commands and timed delays.

## Outcome and completion

- Infer the outcome from the original request plus later corrections. A request to change, build or fix authorizes the local implementation and verification needed to deliver it. A question or problem description without a request to change it makes the assessment the deliverable.
- Turn an open-ended goal into a concrete done condition before starting, stop when it's met, and list further polish as optional follow-ups.
- While obvious authorized work remains, keep going: don't stop at a plan, diagnosis or partial patch, or end with an offer to continue. Stop only when work can't continue without Jesse or a check-in is due.
- Before stopping, reconcile the result against the request and every correction, and show the proof. If something remains, say what, what evidence exists and what blocks it.

## Working rules

- Select skills by the requested action and artifact, not an incidental keyword, and load the smallest useful set. Jesse's explicit instructions override a skill's guidance; when a skill makes you pause, ask or depart from the request, name the skill and quote the instruction.
- Work on a branch in a dedicated git worktree. Never push agent-authored commits to the default branch.
- Publishing (pushing, opening or updating a PR) needs the task to ask for it: "push", "publish", "ship", "update the PR", or a workflow such as `just-do-it` that grants it. Otherwise stop at a local checkpoint and show the result. After pushing finished work to a PR, use `pr-proof-pack`.
- Default to one PR per story and add follow-up work for that story to its open PR. Use a stack, via the installed `gh stack` (see `gh stack --help`), only for two or more dependent review units; never invent a dependency to group changes.
- Before marking a PR ready or merging, make sure `code-review` covers the current changes unless Jesse waived it. Then check in with the review findings and fixes, proof and CI state.
- Merge through the provider's protected flow. For a GitHub merge queue, after the check-in, submit with `gh pr merge <pr-url> --match-head-commit <reviewed-head>`, then confirm queue membership and the eventual merge through GitHub. Never bypass protections or required checks.
- When asked for code review, run only the requested workflow and its required lenses. Never run review bots, such as OpenClaw `$autoreview`, unless Jesse opts in for the task.
- Don't post prose PR or issue comments for Jesse. The only exception is a machine command a named workflow requires on a PR Jesse authored or substantially contributed to, such as `/clawsweeper re-review` in code-review's ClawSweeper workflow.
- Never use `as any` in TypeScript; write proper types or adapters. No decorative comment separators (`=====`, `-----`). E2E and Maestro workflows stay manually triggered.

## Effect code

Before writing or changing Effect code, read `node_modules/effect/AGENTS.md` completely. Resolve API questions against the installed package source, including prerelease `effect/unstable/*` modules.

## Browser work in T3 Code

Apply this section when T3 Code's `preview_*` browser tools are present. Jesse wants browser work that needs him to happen in his Dia browser rather than T3's preview browser.

- Use Dia when the task needs Jesse: sign-in, passkeys or two-factor codes, his logged-in accounts, a CAPTCHA, or a flow he wants to watch or take over. Keep `preview_*` for work that doesn't, such as a local dev server or a public page.
- In Dia, use the harness's browser extension. Codex uses its own browser integration. Claude Code uses the Claude extension's tools: `mcp__chrome__*` under T3, `mcp__claude-in-chrome__*` elsewhere; read `anthropic-skills:chrome-browser` before the first call. If a site permission prompt appears, ask Jesse to click Allow and retry. [Setup](claude/README.md#claude-extension-under-t3) explains how T3 gets these tools.
- Use the `dia` MCP tools only when the extension is unavailable. Dia asks Jesse to approve every new debugging connection, so keep one `dia` server for the whole session: never restart it, run a second copy or reconnect per task.
- Work in a new Dia tab and leave his other tabs alone. At a password, passkey, two-factor or payment step, stop, say what to do in Dia and continue after he confirms.
- If neither the extension nor `dia` connects, say which failed and why. Don't move the task to another browser or profile.

## Claude Code

Apply this section only in Claude Code.

### Browser work

In T3 Code, follow [Browser work in T3 Code](#browser-work-in-t3-code). Elsewhere, use the Claude Chrome integration for websites, authenticated state, screenshots and browser validation. If it's unavailable, report that; don't install another browser harness, change authentication or bypass connection consent. For UI changes, the implementation owner follows `frontend-ui-validation`; review and proof-pack work reuse that evidence.

### Named workers

The main session coordinates on Claude Opus 5.5 at high, without an advisor; Opus 5.5 is the default subagent model. Installing instructions doesn't change live model settings.

When the [named workers](claude/README.md) are installed, use the `Agent` tool with `subagent_type` set to the role. `investigator` and `findings-reviewer` use Opus 5.5 at high for read-only work. `test-executor` runs prepared validation on Haiku 5.5 at high. `Explore` handles codebase searches on Haiku 5.5 at high. `oracle` gives read-only Fable 5.2 advice under the shared model rules.

Pick the model by the work:

- **Haiku 5.5/high** (per-invocation `model` and `effort` override on the right role): prepared checks, codebase search and bounded questions with a checkable answer.
- **Opus**: design decisions, failure diagnosis, review or read-only work that needs judgment. Route changes to files through Sol as above.

When a read-only worker falls short, give it a check the result must pass. If a decision still needs judgment, use the oracle guidance above.

Give each worker the original task text or exact quoted requirements, and review its output against them.
