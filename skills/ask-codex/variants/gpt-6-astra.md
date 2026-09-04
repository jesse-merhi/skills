---
name: ask-codex
description: 'Ask Codex from a non-Codex harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Codex

Use a full Codex ACP session when the user explicitly asks to ask Codex or
invokes `$ask-codex`. Do not infer that authority from a skill mention, link,
or ordinary review, planning, delegation, or implementation request.

## Carry the request into a full session

Build the brief from the user's request and repository evidence: objective,
checkout, relevant files, constraints, expected output, permission to write,
and owned scope. Include Codex's obligation to archive its temporary task with
`set_thread_archived` before finishing. Resolve routine brief details directly;
keep genuinely undecided scope or authority choices with the user.

Resolve `<skill-dir>` to this directory and run the authorized mode:

```sh
# Advice, review, and planning are read-only
<skill-dir>/scripts/ask-codex read "<self-contained prompt>"
# Write only within explicitly authorized implementation scope
<skill-dir>/scripts/ask-codex write "<self-contained prompt>"
```

Use the current Codex configuration, with no hard-coded model and no in-chat
subagent substitution. Record the created task/session ID.

## Accept the result and close its lifecycle

Inspect the evidence and validate edits in the originating session before
reporting completion. Capture the result, verify self-archival, and archive the
exact remaining task in caller cleanup. This applies to success, failure,
cancellation, timeout, and early stop. Use `set_thread_archived` if available,
otherwise `codex archive <id>`. Cleanup needs no separate confirmation.

A fresh one-shot ACP session is the default. An explicitly requested ongoing
cross-harness conversation may retain a persistent named session; archive it
when the user ends the conversation. Surface failed archival with the ID and
report ACP/authentication failures exactly. Never silently replace Codex's
requested answer with your own or a subagent's.
