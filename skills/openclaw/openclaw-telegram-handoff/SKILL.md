---
name: openclaw-telegram-handoff
description: 'Notify the operator on Telegram when an OpenClaw agent finishes, becomes blocked or stalled, or needs user input; also relay a Telegram reply back to the named source session. Use for terminal task handoffs and after openclaw-stg-test, not for routine progress updates.'
---

# OpenClaw Telegram handoff

Send one useful terminal update without turning Telegram into a progress log.

## Outbound handoff

1. Decide whether this is a terminal handoff.

   Notify only when work is complete, cannot safely continue, is genuinely
   stalled, or needs a user decision. A long-running command or unchanged wait
   is not by itself stalled.

2. Resolve the destination without guessing.

   Prefer the current Telegram requester route when the final reply will be
   delivered there. Otherwise use the approved route pair:
   `OPENCLAW_TELEGRAM_NOTIFY_ACCOUNT` and
   `OPENCLAW_TELEGRAM_NOTIFY_TARGET`. Both are required for a fallback route so
   multi-account gateways cannot silently send through the wrong bot. If the
   pair is incomplete, report that notification is unavailable in the normal
   final reply; do not scrape session history, pairing records, or channel
   allowlists for a recipient.

3. Write a self-contained message:

   ```text
   OpenClaw: <done|needs you|blocked>
   <Outcome or concrete blocker in one sentence.>
   Next: <nothing, one action, or one question>
   Task: <existing unique gateway-visible stable task label>
   <PR, staging URL, expiry, or other useful context when applicable>
   ```

   Never include credentials, private endpoint values, raw logs, hidden
   reasoning, the Telegram target, or a raw route-bearing session key. Keep the
   routable session identity inside the gateway. Include `Task` only after
   confirming the source already has a unique stable label that
   `sessions_send` can resolve. Never invent an unbound opaque reference. If no
   such label exists, omit `Task` and say that replies cannot be relayed
   automatically. For staging completion, include the public URL, tested route
   or scenario, lease expiry, and stop command.

4. Deliver once.

   If the current final reply already goes to the same Telegram route, use that
   reply and do not duplicate it. Otherwise prefer OpenClaw's `message` tool.
   When only the CLI is available, first write the exact generated message to a
   run-owned mode-`0600` file through the harness's safe file-writing API.
   Pass the file contents as one quoted argument; never substitute generated
   handoff text into a shell command template. Then use:

   ```bash
   handoff_file=/absolute/run-owned/path/to/telegram-handoff.txt
   openclaw message send \
     --channel telegram \
     --account "$OPENCLAW_TELEGRAM_NOTIFY_ACCOUNT" \
     --target "$OPENCLAW_TELEGRAM_NOTIFY_TARGET" \
     --message "$(command cat -- "$handoff_file")"
   ```

   Confirm the send succeeded, then delete only that run-owned message file. A
   failed notification does not turn completed work into failure; report the
   delivery failure through the originating session and still remove the file.

## Reply relay

When a Telegram message names the bound stable label from one of these handoffs
and supplies the requested answer:

1. Resolve the reference to exactly one active task inside the gateway and
   determine whether its source is the current calling session. Never echo its
   raw route-bearing session key back to Telegram, and do not infer a target
   from a vague reply.
2. If the named source is the current calling session, process the answer as
   the user's direct reply and continue the blocked task in this session. For a
   distinct source session, use `sessions_send` with only the internally
   resolved session selector, the message, and a bounded `timeoutSeconds` value
   when waiting for a response. Do not invent watch or subscription fields.
3. Tell the user whether the answer was processed here or the relay was
   accepted. Do not answer a distinct source agent's blocked question on its
   behalf.

## Done means

- Exactly one terminal update reaches the intended Telegram route, or the
  originating session clearly reports why no approved route exists.
- A needs-user message contains one concrete question and either a bound stable
  task label or an explicit warning that automatic reply relay is unavailable.
- A labeled answer is processed directly in its source session or reaches a
  distinct named source through `sessions_send`, without exposing another
  session's transcript.
