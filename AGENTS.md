# Global agent instructions

This file owns the instructions for every coding harness (Claude Code, Codex,
opencode, Pi). Keep shared rules here and scope harness-specific rules to their
named harness. Edit instructions here.

## Review responsibilities

Assign review duties by the task, not by whether an agent is a subagent.

- The coordinator owns integration, findings decisions, approval requests,
  authorized fixes, validation, commits, publication, handoffs and the final
  report. An agent assigned the whole workflow is a coordinator; a simplifier
  owns its assigned edits; a findings-only reviewer inspects and reports.
- Give fresh reviewers the target, requirements, neutral assignment and available
  proof without implementation rationale or prior findings. Use a configured
  findings-only role when available and retain the applicable domain lenses below.
- Reviewers return supported findings, evidence, unresolved concerns and
  verification limits. They do not edit, manage repairs, publish or run handoff
  workflows. The coordinator confirms findings under code-review's evidence
  requirements and resolves their priority and disposition.
- Reading a skill does not expand the assignment or authorize its workflow.
  Safety, security, permission boundaries, and applicable repository constraints
  remain binding on every agent; role instructions are not a sandbox.

## Communication

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
- Keep replies concise, concrete, and free of repetition while preserving
  necessary evidence and qualifications. Use `speak-fking-english` for
  substantial writing, requested rewrites, unclear explanations, or when a
  delivery workflow requires it; routine short replies need no extra skill read.
- When user input is genuinely required, use the harness's native structured
  question UI when it is available, including outside planning-only modes. Do
  not ask questions when repository evidence, safe investigation, or a
  reasonable low-risk assumption can resolve the uncertainty.
- When asking questions, use a synchronous tool that waits for the user's reply. In Codex, use `request_user_input` where available and permitted; do not use `request_user_input_async`. If no suitable synchronous tool is available, ask in the final response and wait for the user's reply. This preference avoids missed async-question notifications; it does not require asking about routine choices.
- Before closing a substantive task, after a user correction, and before
  reporting a blocked workflow, assess whether `feedback-hardening` is useful.
  Apply this judgment after every code review, including clean reviews; these
  events do not automatically require a separate task. The coordinator owns
  the decision and any handoff; findings-only reviewers send observations in
  their existing report. Follow the skill for the decision, handoff, repair
  authority and completion.

## Coding standards

Before implementing or reviewing code, read `coding-standards` in its
**Read expectations** mode. Use the standards source supplied in the task;
otherwise, when working in this skills repository, use its local
`skills/coding-standards/SKILL.md`, and use the installed skill in other
projects. Follow its applicable principles and the project's recorded
exceptions. That skill owns the standards and the assessment required in
review, including cold review.

## Implementation design

- Start with the requested outcome, the changed behavior and its owner. Read
  callers, dependencies, tests, docs and history as needed to establish the
  affected contract and resolve uncertainty. Trace complete flows when a change
  crosses ownership, lifecycle, security or data boundaries; a local text edit
  does not require the same investigation.
- Before implementing changed behavior, the execution owner records a brief
  proof sketch in the current task context, using existing notes when available:
  the intended caller-visible result,
  reachable failures tied to the changed contract, nearest existing coverage,
  and what remains unproven. This adds no separate document or approval gate.
  Tests may precede or follow implementation; use `writing-good-tests` to
  choose and preserve coverage.
- Treat backward compatibility as the user's decision. If the preferred design
  requires breaking changes, explain why, what will break, and the migration
  path, then ask before proceeding. Do not add compatibility layers by default.
- Choose the simplest implementation that fully meets the current requirements.
  Avoid speculative abstractions, configuration, and indirection.
- Grow the system in layers. Start from the smallest version that works end to
  end, and add each new capability on top of a product that already works.
  Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Make architectural decisions for the long term. Do not implement a stopgap
  intended to be replaced later without the user's explicit approval. Explain
  the durable alternative and why the stopgap is necessary.
- Before creating or changing agent instructions, use `writing-for-agents`
  to select the applicable authoring guidance. For skill changes, read the
  skill's `BASE.md` first and keep shared behaviour there, then adapt every
  supported profile complete; a profile may cover a model family. Variant files
  or shared-content links record coverage.

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

## Test and review design

- Run tests to verify changed behavior, investigate a concrete failure or
  uncertainty, or satisfy an applicable required check. Reuse passing results
  while the code, dependencies, configuration and environment they cover remain
  applicable. Before repeating or broadening a run, identify what invalidated
  that evidence or what question remains unanswered. A new commit, rebase or
  metadata-only edit alone does not justify rerunning unrelated suites. Preserve
  checks explicitly required on the final revision.
- Keep test cleanup tied to the changed behavior and the coverage needed to
  prove it. Touching a test file does not by itself require reorganizing the
  file or repairing unrelated tests. Preserve required coverage and checks.
- Before creating, changing, or removing tests or test infrastructure, load
  `writing-good-tests` in test-planning/portfolio mode. During code review, load it for
  every production behavior change and whenever the diff creates, changes, or
  removes tests or test infrastructure.
- Validate skill instructions through independent agent exercises and review.
  Do not add deterministic tests of skill prose, headings, links, or routing
  wording. Keep deterministic tests for executable scripts and machine-readable
  contracts such as schemas and metadata.
- Do not write tests for linters. A linter is proved by running it on the
  repository inside `validate:effect`; the tree is its fixture, and a rule that
  misfires shows up there.
- During code review, load `reducing-cognitive-load` while assessing the initial
  diff and every proposed fix so reduction happens inside the review loop.

### Evidence before review fixes

- Before repairing a review-discovered bug, apply the evidence checks in
  code-review's Resolve and finish requirements. A reproduction through the actual application using
  realistic local fixtures can qualify; production data is not required.
- Keep evidence tied to the reviewed revision and label what was actually
  observed. A type-permitted value or invented unreachable state is not proof.
- Preserve privacy, access and repair-authority boundaries. This grants no
  production access and never authorizes causing an incident to obtain evidence.

## Model turns

Model cost depends on the model, generated tokens, and input/cache usage.
Repeated model turns can add cost; elapsed time in a held tool call is not
itself model generation.

- Use GPT-6 Astra at xhigh for coordination, integration, verification and review. The
  coordinator may complete small local steps when delegation would not help.
  For meaningful delegated work, use GPT-6 Sol at high for implementation, test design
  and substantive debugging or repairs; use GPT-6 Luna at max for established test,
  lint, typecheck and prepared acceptance execution, bounded investigation and
  focused research. `writing-good-tests` owns execution batches and receipts.
  Use xhigh for every Astra assignment unless the user explicitly overrides it.
- Assign skill execution by the work, not by which model variants are installed.
  Use Sol/high for substantive code, test, skill-prompt, UI and artifact changes.
  Use Luna/max for bounded retrieval and inventory work, such as `session-recall`
  searches and `skill-cleaner` inventories, and for prepared validation batches,
  including UI and local-preview checks when the worker has the required tools.
  Keep test design and failure diagnosis with Sol; `writing-good-tests` owns the
  executor's batch and failure boundaries. Apply the harness-specific worker
  mapping below where it replaces the shared model choices.
- Keep coordination, review decisions, integration, final verification,
  permission decisions and delivery with the coordinator. Complete `handoff`,
  `ask-codex` and cleanup workflows retain their existing owners and authority;
  only suitable bounded steps may be delegated when their contracts allow it.
  Shared standards and domain skills remain available to every consuming model:
  reading one does not make that model the execution owner. Keep existing
  findings-only reviewer exclusions. Small local steps and unavailable worker
  capabilities follow the delegation and launcher rules here; do not spawn a
  worker solely to load a skill or wait.
- Apply an explicit user model or effort override only to its named task. Set
  model and effort through the launcher; a prompt cannot override a launcher's
  fixed settings. If the selected configuration is unavailable, report that
  limitation instead of silently substituting another model or effort.
- Delegate useful independent work on demand. Do not create the full model tree
  automatically. Delegate only when briefing the worker and checking its output
  costs less than doing the work directly. Give each worker a bounded task and
  completion condition, keep dependent work sequential, and leave integration
  with the coordinator. A worker stops and returns evidence on failure or
  ambiguity.

- Batch independent calls while bounding their combined output. Retain full
  structured results in session storage or run-owned files, inspect every result,
  and emit the fields needed for the next decision. Size the combined response
  against the outer tool's output allowance, not only each inner call's limit.
  Split required document text into batches that fit and read every required
  part; truncation is not a completed read. In Codex, use `Promise.allSettled`
  inside code mode for independent reads. Keep dependent calls, writes and
  approval-sensitive actions serial.
- Use `wait-efficiently` for worker assignments and results, pending agents, CI
  monitoring, long-running commands and timed delays. Quick command batches
  need no extra skill read.

## Outcome and completion

- Infer the intended outcome from the original request and the user's later
  corrections. Treat a correction as part of the current outcome unless the
  user replaces the task.
- A request to change, build, or fix authorizes the ordinary local
  implementation, integration, and verification needed to deliver that outcome
  within the existing permission, publication, and destructive-action
  boundaries. Do not stop at a plan, diagnosis, or partial patch while obvious
  authorized work remains.
- Before stopping, apply the [communication proof requirements](#communication),
  reconcile the result against the original request and every accepted
  correction, then finish any obvious missing in-scope step that needs no new
  authority or user decision.
- If the outcome remains incomplete, state exactly what remains, what evidence
  was established, and which blocker prevents completion.

## Working rules

- Select skills by the requested action and artifact, not an incidental keyword.
  Use explicitly requested skills and required workflow lenses. For optional
  skills, load the smallest set that serves the task; read supporting references
  when their branch is needed. For example, an iOS bug without a Figma artifact
  does not need a Figma translation workflow.
- Work on a branch in a dedicated git worktree. Never push agent-authored
  feature or fix commits directly to the default branch. When publication is
  authorized, push the work to its feature branch and deliver it through a PR.
- Treat publication as a separate authority from local implementation. A
  request to fix or review authorizes local edits and validation. Push when
  the user explicitly asks to push after the fix, publish, ship, or update the PR,
  or when a named workflow explicitly grants final-push authority. Otherwise,
  stop at a local checkpoint and show the result.
- Always use the installed `repo-queue` skill for authorized GitHub or Bitbucket
  Cloud PR merges on this machine, even when the user does not mention the queue.
  Acquire the repository turn before the final update from the target branch,
  merge-validation run, and merge. Its [installation and supported surfaces](external.md#local-pr-turns)
  are maintained separately. If it is unavailable, report the setup blocker
  instead of silently bypassing the queue. Implementation and review alone do
  not require a turn.
- Choose the PR delivery shape before implementation. Keep one cohesive change
  in one PR. When one story contains two or more dependent review units, plan a
  bottom-to-top stack before editing. Use the installed `gh stack` tool
  and discover commands through `gh stack --help`. Keep independent or
  unrelated work in separate PRs or stacks; never invent a dependency merely
  to group changes.
- Review gate: before marking ready, requesting sign-off or merging, ensure
  `code-review` covers the current changes unless the user explicitly waives it.
  The agent decides whether more review or tests are needed, favors reuse, and
  records its reasoning without asking permission within the authorized task.
- Sign-off gate: after the review decision, proof, validation, and CI pass,
  summarize the review findings and fixes or the explicit waiver, then check
  for a thumbs-up (`+1`) reaction. Resolve the expected human login from task or
  project configuration; otherwise use the authenticated GitHub login reported
  by `gh api user --jq .login`. Treat that person's existing `+1` as blanket
  sign-off for the PR regardless of when it was added. It remains valid across
  later commits, review fixes, validation, and CI; do not require a fresh
  reaction for the final head. Ask for a `+1` only when no reaction from that
  person exists. For a stack, apply both gates and require that person's
  separate reaction on every open PR, not only the top PR.
  Never add, remove, or modify that reaction on the user's behalf; only read
  GitHub reactions and proceed after the expected reaction exists. This is an
  agent workflow gate, not a GitHub approval or branch-protection rule.
  The reaction gates merge; it does not block authorized PR updates or local
  repair work.
- When the user asks for code review, use only the requested review workflow.
  Required lenses named by that workflow or these instructions are part of it.
  Do not substitute or add unrelated review workflows or review bots,
  including `autoreview`, unless the user explicitly asks for them.
- The user opts out of OpenClaw `$autoreview` by default. Never run it, even when
  repository instructions call it a mandatory gate, unless the user explicitly
  opts in for the current task.
- During code review, compare new custom infrastructure logic with repository,
  runtime, framework, and installed-dependency features. Treat duplicated
  behavior as actionable when it creates competing implementations, semantic
  drift, or missed edge cases.
- Stop on the first test error. Diagnose before rerunning; never rerun to see
  if it passes the second time.
- Do not post prose PR or issue comments on the user's behalf. A named workflow
  may post its exact machine command only when that workflow explicitly requires
  it and the PR is authored by, or has been substantially contributed to by,
  the user. `clawsweeper-until-clean` may post only its documented
  `/clawsweeper re-review` command under this exception. Otherwise, report in
  chat or ask for explicit authorization; never generalize the exception to
  findings, summaries, or conversational comments.
- Never use `as any` in TypeScript. Provide proper types or adapter
  functions.
- No decorative comment separators (`=====`, `-----`) in code.
- E2E and Maestro test workflows stay manually triggered. Do not add
  automatic triggers.

## Effect code

Before writing or changing Effect code, read `node_modules/effect/AGENTS.md`
completely. Resolve API questions against the exact installed package source;
the v4 APIs used here include prerelease `effect/unstable/*` modules.

## Claude Code

Apply this section only when running in Claude Code. Other harnesses use the
shared rules above and their own available tools.

### Browser work

Use the available Claude Chrome integration for website interaction,
authenticated browser state, screenshots, and browser-driven validation.
Select the intended tab from the integration's current state. If it is
unavailable, report the missing capability; do not install another browser
harness, change authentication, or bypass connection consent.

For UI changes, the implementation owner follows `frontend-ui-validation`.
Review and proof-pack work reuse that evidence rather than starting duplicate
browser sessions.

### Named workers

Keep the normal main session as coordinator and preserve the user's selected model. When the optional [named workers](claude/README.md) are available, use Claude Code's `Agent` tool with `subagent_type: "implementer"`, `"investigator"`, or `"findings-reviewer"` for a useful bounded assignment. Their native definitions select Fable at high for implementation, Fable at medium for investigation, and Opus 5.5 at xhigh for independent review; these Claude worker settings replace the shared GPT worker mapping in this harness. Honor explicit user overrides through the launcher and report unavailable settings instead of silently substituting.

The coordinator retains sequencing, integration, validation and delivery. Give each worker the task objective, revision and worktree, owned scope, constraints, acceptance criteria and relevant evidence. Start an independent reviewer fresh, without implementation rationale or prior findings; never use it as an until-clean coordinator or a replacement for the required native review phase.
