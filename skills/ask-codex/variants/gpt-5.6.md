---
name: ask-codex
description: 'Ask Codex from a non-Codex harness through a full ACP session for an independent answer or explicitly scoped implementation.'
---

# Ask Codex

Obtain an independent Codex result from a full ACP session, then archive the
temporary task. Run only for an explicit `$ask-codex` invocation or a request
to ask Codex. Mentioning or linking this skill, or requesting review, planning,
delegation, or implementation, does not by itself authorize it.

Resolve `<skill-dir>` to this skill's directory. Give Codex a self-contained
brief with objective, checkout, relevant files, constraints, expected output,
write permission and owned scope, and a requirement to archive its task before
finishing. Use the current Codex configuration without fixing a model.

```sh
# Advice, planning, or review
<skill-dir>/scripts/ask-codex read "<self-contained prompt>"
# Explicitly authorized implementation in the named scope
<skill-dir>/scripts/ask-codex write "<self-contained prompt>"
```

Record the created task/session ID. Inspect its evidence and validate edits in
the originating session. Use a fresh one-shot ACP session rather than an in-chat
subagent. An explicitly requested ongoing cross-harness conversation may use a
persistent named session until the user ends it.

Require Codex to self-archive using `set_thread_archived`. After capturing its
result, verify archival. Guaranteed caller cleanup must archive the exact task
on success, failure, cancellation, timeout, or early stop when self-cleanup did
not happen: use `set_thread_archived` if available, otherwise `codex archive <id>`.
Archive a requested persistent session when its conversation ends. Report any
failed archival with its exact ID.

Report ACP or authentication failures as failures; do not replace Codex with a
subagent or your own answer.
