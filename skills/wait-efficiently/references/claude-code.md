# Claude Code hold mechanisms

Claude Code API. Replace this file when the API changes; the rules in
`SKILL.md` do not change with it.

Claude Code re-invokes the agent when tool-tracked work finishes, so the
cheapest hold is usually no wait at all.

## One notification when work finishes

Run the work with `Bash` and `run_in_background: true`, using a command that
exits when the condition is true:

```sh
until grep -q "Ready in" dev.log; do sleep 0.5; done
```

The completion notification arrives on its own. Continue with other work in the
meantime, and reach for `BashOutput` only when the notification names something
that needs inspecting.

## One notification per occurrence

Use `Monitor`, whose every stdout line becomes a notification. Filter to the
lines worth acting on, and cover failure states as well as success. A filter
matching only the success marker stays silent through a crash, and silence reads
as "still running".

```sh
tail -f run.log | grep -E --line-buffered "elapsed_steps=|Traceback|FAILED|Killed|OOM"
```

Set `persistent: true` for a session-length watch; otherwise `timeout_ms` caps
it at one hour.

## Blocking in the foreground

Use `Bash` with `timeout`, whose ceiling is 600000 ms. Foreground `sleep` is
blocked, so express a delay as a condition to wait on rather than a nap.

## Subagents

Subagents run in the background and report on completion. Continue with
independent work and let the notification arrive; use `SendMessage` when a
running agent needs new information.

## Scheduled wake-ups

`ScheduleWakeup` fits external state the agent tool cannot observe, such as a CI
run or a remote queue, sized to how fast that state actually changes. For
tool-tracked work, the completion notification already arrives, so a wake-up
scheduled to check on it is a wasted round trip.
