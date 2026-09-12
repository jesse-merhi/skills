# Repository maintenance

These notes are for agents changing this repository's source. They are not installation steps or instructions for users of the installed skills.

During repository work, check an open item if its last successful check was at least seven days ago. Check at most once per task. This is an opportunistic check, not a scheduled monitor; do not wait for the next due date. If access fails, leave the last-checked date unchanged and continue the requested work.

After a successful check, update the item's date and status here. Tell the user about meaningful changes, such as a maintainer response, a workaround, or a released fix. An unchanged issue needs no separate status message. Read-only checks do not authorize posting comments or changing installed configuration.

## Async question notifications

- Issue: [openai/codex#42433 — New inline questions don’t trigger pet or desktop notifications](https://github.com/openai/codex/issues/42433).
- Last checked: 2026-09-13.
- Status: Open, zero comments; no linked fix shown.
- Context: Non-blocking questions reportedly fail to trigger desktop notifications even with question notifications enabled. The report also describes missing pet indicators and unanswered questions disappearing when work finishes.
- Current user preference: The synchronous-question rule lives in `AGENTS.md` under Communication. Installation continues to use that shared instruction file; this maintenance check applies only to source-repository work.

When due, read the issue, its comments, and any linked fix or release information. If an update claims to fix notification delivery, tell the user what version and evidence are available. Keep the synchronous preference until the user chooses to revisit it; issue closure alone is not proof that notifications work in their installed app. Once a fix is verified and the user settles the preference, record the outcome here and retire the recurring check.
