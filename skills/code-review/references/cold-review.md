# Run an independent review

Give a fresh reviewer the exact target, base, head, changed files and requested evidence. Use a findings-only agent with no inherited conversation or resumed session. Keep prior findings, attempted fixes and implementation discussion out of its brief.

Give the reviewer a separate, accessible summary of prepared runtime versions, the checked revision, exact validation commands, observed results and relevant limitations, with links to the supporting output. Include failures and missing proof as well as passes. Exclude prior findings, verdicts and repair explanations from this material. A passing check covers only what it exercised; the reviewer still assesses requirements and behavior. Reuse applicable results, and request or run additional checks for a concrete gap, changed input or unresolved concern. If a check cannot run in the reviewer’s environment, report that limit to the coordinator instead of repairing the tooling or environment.

Use Astra at medium unless the user selects another reviewer. Set model and effort through the launcher, including from Claude; a prompt cannot change a fixed-high preset. Report an unavailable configuration rather than silently substituting another model.

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

Include other requested domain skills. Use one general independent reviewer when it can cover the change. Add a focused reviewer only for a named unresolved area requiring separate expertise or capacity; keep the same substantive test and TypeScript standards in the general review. Identify relevant repository validation commands for the main agent to run after fixes.

For substantial independent areas that one reviewer cannot assess adequately, divide end-to-end flows among reviewers and assign their shared boundaries explicitly. Keep one combined findings list and review loop; individual areas do not need their own clean-pass loops. Follow inputs through changed code, state and external calls to their consequences. The CLI tracks file coverage, not runtime behavior. For each affected flow, return its real entry point, expected outcome, important failure or recovery path, and what was inspected, executed or left unresolved. Use existing evidence where it answers the question; do not create a test for every checklist item.

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

Prioritize stale/unreviewed files, then reviewed-once, then reviewed-twice. Give reviewers the files and observed `changeId`, not previous counts or verdicts. Ask for substantively assessed files, their observed change IDs and the invocation ID. Read unchanged code for context, not unrelated review targets.

Wait on the existing invocation using `wait-efficiently`. After it returns, include one coverage object in the coordinator’s review-result batch for the general invocation. Context reads and focused-skill checks are not whole-file coverage. Check and record findings only after the independent return, then continue the main review loop.
