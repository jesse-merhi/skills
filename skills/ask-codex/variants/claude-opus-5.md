---
name: ask-codex
description: 'Ask Codex from a non-Codex harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Codex

Deliver one independent Codex result with inspected evidence and a closed
temporary-task lifecycle. Launch only on the user's explicit request to ask
Codex or invoke `$ask-codex`; mentions, links, and general review or implementation
requests are insufficient.

Send one compact brief covering the objective, checkout, relevant files,
constraints, expected output, write authority, owned scope, and a requirement
to self-archive with `set_thread_archived`. Resolve `<skill-dir>` to this directory.

```sh
# Read-only advice, review, or planning
<skill-dir>/scripts/ask-codex read "<self-contained prompt>"
# Implementation expressly authorized in the brief's scope
<skill-dir>/scripts/ask-codex write "<self-contained prompt>"
```

Keep the current Codex configuration. Use one fresh full ACP session, record
its task/session ID, inspect returned evidence, and validate any edits in the
originating session. Do not add an optional verification worker or substitute
an in-chat subagent. Report only meaningful progress during the wait.

Accepting the result includes cleanup: require self-archival, capture the result,
then verify archival. On success, failure, cancellation, timeout, or early stop,
archive the exact remaining task with `set_thread_archived`, or
`codex archive <id>` when that tool is unavailable. Report an archival failure
with its ID. An explicitly requested persistent cross-harness conversation may
keep its named session until the user ends it, when archival becomes due.

Return a concise supported answer. If ACP or authentication fails, report that
failure without replacing Codex's answer with your own.
