# Run an independent review

Give a fresh reviewer the exact target, base, head, changed files and requested evidence. Use a findings-only agent with no inherited conversation or resumed session. Keep prior findings, attempted fixes and implementation discussion out of its brief.

A brief can say: “Review this target with the supplied skills. Trace changed behavior through real callers and system events. Return distinct problems, changed locations, triggers, consequences, likelihood and impact evidence, uncertainty, and rejected candidates with reasons. Report what you could not verify. Do not edit code or manage repairs.”

## Skills and assignments

Give reviewers these inputs:

- `reducing-cognitive-load` for readable code and simple, accurate names.
- `writing-good-tests` in review-only test-planning/portfolio mode for behavior, test or test-infrastructure changes.
- `typescript-discipline` for TypeScript code, shared types, schemas and API contracts.
- `frontend-ui-validation` for UI changes: assess the implementation owner's evidence and request missing states or interactions.
- `design` in motion-review mode for animation, gestures and transition timing.

Include other requested domain skills. Add a focused test reviewer and a focused TypeScript reviewer when their conditions apply. Identify relevant repository validation commands for the main agent to run after fixes.

For substantial independent areas, divide files or flows among reviewers. Keep one combined findings list and review loop; individual areas do not need their own clean-pass loops. Follow inputs through changed code, state and external calls to their consequences. The CLI tracks coverage, not runtime behavior.

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

Wait on the existing invocation using `wait-efficiently`. After it returns, record one `review-findings coverage-record` batch per general invocation using its help and the saved run identity. Context reads and focused-skill checks are not whole-file coverage. Check and record findings only after the independent return, then continue the main review loop.
