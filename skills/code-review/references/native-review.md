# Launch the native reviewer

Use the requested engine, model and effort. Otherwise, use Codex with Astra at medium, including from Claude. If the requested configuration is unavailable, report the limitation rather than substituting another review.

## Codex

For the checked-out PR branch:

```sh
codex-review --mode branch --base <base>
```

For a specific commit:

```sh
codex-review --mode commit --commit <sha>
```

The helper pins Astra at medium, checks the clean checkout, runs the actual review, saves output and attempts to archive successful review sessions. Its installed `findings-reviewer` profile supplies readability, test and TypeScript instructions when available; the helper does not take a custom review brief. Use `codex-review --help` for output paths. It uses the host's standalone Codex identity, including when called from Claude or OpenClaw. For an explicit model or effort override, use a supported native launcher that honors it; this helper cannot override its pinned settings.

For a branch review, run `git rev-parse HEAD <base>` before and after the helper. For a commit review, pass the saved SHA. A changed target, dirty checkout, nonzero exit or missing result means incomplete, not clean. The helper may retry a changed target up to three times; if it reports a different target, restart the pass against the intended committed code.

The actual review establishes whether authentication and the selected model work. Do not run a separate paid probe before ordinary reviews. If a failure needs authentication diagnosis, `codex-review --check-auth` runs the existing diagnostic and stops without reviewing code; its live probe is an additional model request. Preserve the original review failure and repair the specific blocker before a permitted retry.

After a failure, cancellation or archiving warning, archive only sessions identified as belonging to this invocation with `codex archive <session-id>`. Preserve the review output. Report cleanup you cannot complete rather than archiving unrelated sessions.

## Claude Code

```text
Workflow({ name: "code-review", args: "high <target>" })
```

Use this fixed-high workflow only when the user selects Claude review and authorizes high effort. Use a base range such as `main...HEAD`, a commit SHA or the checked-out PR number. Call the built-in workflow rather than a similarly named personal slash command. Supply the target, not a custom prompt. Wait for completion and follow its documented cleanup.

Check both `CONFIRMED` and `PLAUSIBLE` candidates. An interrupted or missing result is incomplete. Do not assume the native reviewer read the same skill inputs as a custom reviewer.

Wait on the existing invocation instead of starting another. Record the result and check its findings before running the next pass.
