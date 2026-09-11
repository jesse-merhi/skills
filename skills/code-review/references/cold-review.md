# Run an independent review

Give a fresh reviewer the exact target, base, head, changed files and requested evidence. Use a findings-only agent with no inherited conversation or resumed session. Keep prior findings, attempted fixes and implementation discussion out of its brief.

Tell the reviewer which runtime versions and commands you used, which commit you checked, and what passed, failed or remains unchecked. Link the output. Leave out earlier findings, verdicts and repair explanations. Passing tests do not replace reviewing the code. Reuse results that still apply; run more checks when something changed or a specific question remains unanswered. If the reviewer cannot run a check, report that to the coordinator; do not repair the environment.

Follow the model policy in the applicable `AGENTS.md` unless the user selects another reviewer. Set model and effort through the launcher, including from Claude; a prompt cannot change fixed launcher settings. Report an unavailable configuration rather than silently substituting another model.

A brief can say: “Review this target with the supplied skills. Trace changed behavior through real callers and system events. Return distinct problems, changed locations, triggers, consequences, likelihood and impact evidence, uncertainty, and rejected candidates with reasons. Report what you could not verify. Do not edit code or manage repairs.”

Require one complete report after assessing all assigned behaviors. Include every distinct candidate and rejected claim; do not send findings one at a time or stop after the first few.

Ask reviewers to establish intended behavior from the task, documentation, callers, tests and base revision. Intentional contract changes are not automatically regressions; material conflicts become questions. Evidence should name the expected result, reachable inputs or state, and observed outcome. Missing, unexecuted or stale proof is not an observed failure.

## Skills and assignments

Give reviewers these inputs:

- `reducing-cognitive-load` for readable code and simple, accurate names.
- `writing-good-tests` in review-only test-planning/portfolio mode for behavior, test or test-infrastructure changes.
- `typescript-discipline` for TypeScript code, shared types, schemas and API contracts.
- `frontend-ui-validation` for UI changes: assess the implementation owner's evidence and request missing states or interactions.
- `design` in motion-review mode for animation, gestures and transition timing.

Include other skills the user requested. Use one independent reviewer. Add a specialist only for a specific part they cannot cover well, and explain why. The main reviewer still checks tests and TypeScript. They tell the main agent which test, typecheck, lint or build commands to run after fixes.

If several reviewers are needed, assign each a feature or execution path and specify who checks the code they share. Follow inputs through the changed code, state and external calls to the result. Keep their findings in one list and run one review-and-repair loop for the combined change. Each reviewer reports where execution starts, what should happen, how failure or recovery works, and what they read, ran or could not verify. File counts alone do not show that behavior was checked. Reuse evidence that answers the question; do not add a test for every checklist item.

## Fresh context

- Codex CLI: use the installed `findings-reviewer` profile in a fresh session. It disables memory injection, generation, dedicated memory tools and session recall.
- Claude subagents: use a fresh findings-only agent without a `memory` field. For a separately authorized fresh Claude CLI session, set `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` for that process only.
- Other hosts: use their supported fresh-context option and disclose unverified memory isolation.

If earlier findings enter a reviewer's context, replace that reviewer. These controls are not a filesystem sandbox; leave global memory and permissions unchanged. If independent dispatch is unavailable, disclose that limitation rather than labeling self-review independent.

## Coverage and results

Before assigning general review:

```sh
review-findings coverage-status --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base> --json
```

Prioritize stale/unreviewed files, then reviewed-once, then reviewed-twice. Give reviewers the files and their `changeId`, without previous counts or verdicts. Ask them to list the files whose changed behavior they checked, with the observed change IDs and review invocation ID. Read unchanged code when needed to understand the change; keep findings within the requested scope.

Wait for that review using `wait-efficiently`. After it returns, the coordinator checks the findings and records them with the review handle, together with the files whose changed behavior was assessed. Finish the review only after every record succeeds. Reading a file for context or checking only one concern does not count as reviewing all its changed behavior. Continue the main review loop.
