# Launch the native reviewer

Use the requested engine, model and effort. Otherwise, use Codex with Astra at medium, including from Claude. If the requested configuration is unavailable, report the limitation rather than substituting another review.

## Codex

For normal Codex review, use the launcher that owns the saved review:

```sh
review-findings review native <saved scope flags>
```

It runs the existing `codex-review` helper with Astra at medium, saves the output outside the checkout and returns a review ID and report path. The helper uses the host's standalone Codex identity and attempts to archive its successful sessions. Repeating the command while that review is open returns its state without another model request. Record the complete report through the review commands before finishing it.

For an explicit model or effort override, reserve a native review with `review start --phase native`, then use a supported launcher that honors the selection. The pinned helper cannot override its model settings. Pass the exact target and disclose an unavailable configuration.

The standalone helper remains available for separately requested use: `codex-review --mode branch --base <base>` or `codex-review --mode commit --commit <sha>`. Check the target before and after a standalone invocation. A changed target, dirty checkout, nonzero exit or missing result is incomplete. Preserve its output and finish the reserved review as blocked when the result cannot apply to its saved target.

The actual review establishes whether authentication and the selected model work. Do not run a separate paid probe before ordinary reviews. If a failure needs authentication diagnosis, `codex-review --check-auth` runs the existing diagnostic and stops without reviewing code; its live probe is an additional model request. Preserve the original review failure and repair the specific blocker before a permitted retry.

After a failure, cancellation or archiving warning, archive only sessions identified as belonging to this invocation with `codex archive <session-id>`. Preserve the review output. Report cleanup you cannot complete rather than archiving unrelated sessions.

## Claude Code

```text
Workflow({ name: "code-review", args: "high <target>" })
```

Use this fixed-high workflow only when the user selects Claude review and authorizes high effort. Use a base range such as `main...HEAD`, a commit SHA or the checked-out PR number. Call the built-in workflow rather than a similarly named personal slash command. Supply the target, not a custom prompt. Wait for completion and follow its documented cleanup.

Check both `CONFIRMED` and `PLAUSIBLE` candidates. An interrupted or missing result is incomplete. Do not assume the native reviewer read the same skill inputs as a custom reviewer.

Wait on the existing invocation instead of starting another. Record the result and check its findings before running the next pass.
