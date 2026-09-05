# Global agent instructions

Shared instructions for every coding harness (Claude Code, Codex,
opencode, Pi). Keep this file harness-agnostic. Anything Claude-specific belongs
in `CLAUDE.md`, which imports this file and layers on top of it.

## Review responsibilities

Assign review duties by the task, not by whether an agent is a subagent.

- The coordinator owns the review loop, findings registry, approval requests,
  authorized fixes, validation, commits, publication, handoffs, and user-facing
  summary. A subagent assigned an until-clean workflow is a coordinator for
  that workflow; it is not a findings-only reviewer.
- A findings-only reviewer is assigned to inspect and report, not to run the
  fix-and-rerun workflow. Use a findings-only reviewer preset when the harness
  exposes one; never select it for an until-clean coordinator. Give it the
  target, neutral checklist, and requested evidence without implementation
  rationale or prior findings. It uses
  `finding-discipline` as the authority for finding eligibility, severity, and
  reporting, and consults relevant domain skills while retaining the mandatory
  review lenses below. Keep those policies in their owning skills rather than
  copying them into role instructions.
- The reviewer returns findings with their rating evidence, rejected candidates,
  verification limits, and requested coverage evidence to the coordinator. It
  does not edit code, write the findings registry, manage fixes or reruns,
  publish, or run writing and handoff workflows for its internal report. The coordinator records the
  returned evidence, obtains CLI-derived severity and disposition, and handles
  user-facing presentation and delivery gates.
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
- Immediately before a user-facing final response, load `speak-fking-english`.
- Stay concise while preserving the explanation needed to understand the work.
- When user input is genuinely required, use the harness's native structured
  question UI when it is available, including outside planning-only modes. Do
  not ask questions when repository evidence, safe investigation, or a
  reasonable low-risk assumption can resolve the uncertainty.
- When an evidence-backed user correction exposes reusable agent behavior or
  asks to codify prevention in instructions, skills, lint, tests, or other
  controls, load `feedback-hardening` before systemic repair. Task-local repair
  may continue under existing authority, but a prevention request is not
  advance approval of an unbound systemic recommendation.

## Implementation design

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
- Before creating or changing any skill, load `writing-for-agents` and
  `model-writing-guides`. Update the complete prompt for every supported model;
  variant file presence is the coverage record.

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

- Before creating, changing, or removing tests or test infrastructure, load
  `test-audit` and apply its portfolio policy. During code review, load it for
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

## Model turns

Model cost depends on the model, generated tokens, and input/cache usage.
Repeated model turns can add cost; elapsed time in a held tool call is not
itself model generation.

- Use medium reasoning for implementation, review, and delegated work. Do not
  escalate to high, xhigh, max, or ultra automatically. Apply an explicit user
  override only to its named task. Set supported effort through the launcher;
  a prompt cannot override a role with fixed high effort.
- Keep implementation, diagnosis, architecture, and review with the capable
  owner. Use Astra at medium for Codex review, including review launched from
  Claude, unless the user selects another reviewer. No silent model fallback.
- For sustained mechanical work, use `handoff`'s mechanical-worker mode:
  Luna at medium runs already-selected checks, collects logs, watches CI, or
  packages approved evidence. One brief must cover the whole phase. A quick
  command or an existing held wait stays local. Do not delegate implementation
  or spend a solution's worth of reasoning briefing a cheaper worker.
- Once a worker owns the phase, use its verified callback or native event wait;
  do not duplicate status checks or narrate unchanged progress. The worker
  returns completion, first failure, stale target, deadline, or a decision
  requiring the owner. Diagnosis and fixes return to the owner.

- Batch independent calls into one turn. Reads, greps, and status checks that do
  not depend on each other belong in a single request: `Promise.all` inside one
  Codex code-mode cell, or several tool calls in one response where the harness
  runs them natively. Keep dependent calls, writes, and approval-sensitive
  actions serial.
- Start one event-driven wait sized to the mechanism and expected completion
  time, then resume that same wait or process if the harness yields. A wait
  deadline is a ceiling, not a required delay; there is no universal minimum.
  Load `wait-efficiently` for anything longer or more involved than a single
  command.

## Working rules

- Work on a branch in a dedicated git worktree. Never push agent-authored
  feature or fix commits directly to the default branch. When publication is
  authorized, push the work to its feature branch and deliver it through a PR.
- Treat publication as a separate authority from local implementation. A
  request to fix or review authorizes local edits and validation. Push when
  the user explicitly asks to push after the fix, publish, ship, or update the PR,
  or when a named workflow explicitly grants final-push authority. Otherwise,
  stop at a local checkpoint and show the result.
- Choose the PR delivery shape before implementation. Keep one cohesive change
  in one PR. When one story contains two or more dependent review units, load
  `gh-stack` and plan a bottom-to-top stack before editing. Keep independent or
  unrelated work in separate PRs or stacks; never invent a dependency merely
  to group changes.
- Review gate: before marking any PR ready, asking for human sign-off, or
  merging, verify that `code-review` completed on the exact current head. A
  valid closeout names that head and records the native phase, cold phase,
  findings, review fixes, verification, and anything still open. Treat missing,
  stale, or unverifiable evidence as not reviewed; CI, proof-pack, and ad hoc
  review do not count. Tell the user and use the native structured question UI
  to ask whether to run `code-review` or proceed without it for this PR and
  head. Do not start the expensive review automatically. An explicitly invoked
  named workflow that requires `code-review` and grants that authority counts
  as the user's review decision; record it and continue without asking again.
  An unanswered review decision blocks readiness and merge. Record an explicit
  waiver in closeout.
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
