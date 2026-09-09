# Claude Code waits

Use the current host's exposed schemas.

1. For a command, use tracked `Bash` with `run_in_background: true` when completion notifications are supported. Keep the task ID, do independent work, then inspect its terminal result on notification.
2. Without that notification contract, hold the foreground command and use the exposed task-result mechanism until it finishes. Do not replace it with a new shell process.
3. For an authorized subagent, use the exposed `Agent` tool and its completion mechanism. Keep its handle; resume only when its history belongs to the task. A cold reviewer must be fresh, not a resumed or forked implementation worker.

Use `Monitor` only if exposed and repeated actionable events are needed, not for one completion. Filter its output for meaningful changes and failures, and respect its lifetime and timeout limits.

For external state without tracked completion, use a host scheduling tool only when the user requested a later check. Do not add a timer for an already-tracked command or agent. A background notification does not by itself guarantee an ended parent turn will wake. Missing tools are a limitation to report, not permission to install replacements or change authentication.
