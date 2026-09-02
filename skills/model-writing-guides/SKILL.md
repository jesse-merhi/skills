---
name: model-writing-guides
description: 'Select model-specific writing guidance for another skill, including exact coverage checks, same-family fallback, and one task-wide stale-coverage notice.'
---

# Model writing guides

Use this skill when another skill points here before execution. The calling
skill keeps its durable behavior; this skill adds only the guidance that
compensates for the current model in the calling skill's declared mode.

## Resolve the profile

1. Take the exact active model identifier from the harness or system context.
   The model running this turn wins over a saved default in configuration. Do
   not infer identity from writing style. If the harness exposes no identifier,
   leave it empty.
2. Locate the calling skill's `model-writing.json` and run:

   ```sh
   node <model-writing-guides-dir>/scripts/resolve-model-writing-guide.mjs \
     --model '<active-model-id>' \
     --coverage <calling-skill-dir>/model-writing.json
   ```

3. Confirm that the returned `mode` matches the calling skill. Read
   `guideReference` when it is not `null`. Read
   `skillAdapterReference` too when it is not `null`. Load no other model
   profile.

The resolver accepts a model only when both the central registry and the
calling skill cover it. Otherwise it chooses the newest profile already covered
by that skill in the same model family. It never borrows behavioral patches
from another family. With no same-family profile, keep the calling skill's
shared behavior without a model pass.

## Report stale coverage once

When `noticeRequired` is `true`, check whether any earlier assistant message in
the current task already gave a model-writing coverage notice. If none did,
show the returned `notice` in a separate user-facing progress or status update
before finalizing the requested output. When the harness has no separate
channel, include it only in an ordinary prose response that permits extra text.
If the required output is schema-constrained, machine-consumed, or otherwise
forbids extra prose, preserve that output and defer the notice until the next
prose-safe reply in the task. Once one such notice has appeared, do not repeat
it for this or another skill during the same task.

The notice is informational. Continue the calling skill with the returned
fallback or its shared behavior. Do not stop, ask for permission, or omit the
requested writing pass because coverage is stale.

## Maintain the registry

[`references/registry.json`](references/registry.json) is the source of truth
for known model profiles, exact matching, family fallback, execution modes,
official writing-guide URLs, and the date each guide was reviewed. Every model
profile covers every registered mode. Add a profile when a new model-specific
official guide appears. Keep each profile variant and local adapter to
behavioral deltas that change execution; link the source instead of copying its
manual.

Done when the calling skill used exactly one compatible model profile or its
shared behavior, stale coverage was disclosed no more than once in the task,
and the calling skill still completed normally.
