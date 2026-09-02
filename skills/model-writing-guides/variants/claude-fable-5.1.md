---
name: model-writing-guides
description: 'Maintain complete model-specific skill variants and add coverage when a new model or official prompting guide appears.'
---

# Model writing guides

Maintain complete skill prompts for each supported model. Installation must
expose exactly one selected prompt as `SKILL.md`; it must not ask the model to
route to another file.

Batch independent guide and variant reads. Use current official sources for
version-sensitive claims. During long work, report when source evidence changes
the rewrite. Finish every affected variant and its validation. Keep edits
targeted to the requested skill set and model profiles.

## Supported profiles

- GPT-5.6: [gpt-5.6.md](references/gpt-5.6.md)
- Claude Fable 5.1:
  [claude-fable-5.1.md](references/claude-fable-5.1.md)
- Claude Opus 5: [claude-opus-5.md](references/claude-opus-5.md)

Batch those independent guide reads. The exact matchers and fallback order are
in [`scripts/materialize-skill-variants.mjs`](scripts/materialize-skill-variants.mjs).
Files under `variants/` record coverage; there is no per-skill manifest.

## Update every affected variant

1. Read the existing variants and shared references.
2. Write down the common behavior: outcome, permissions, ordered invariants,
   completion criteria, commands, and evidence. Finish this before editing.
3. Fetch unfamiliar or version-sensitive claims from the current official
   guides. Report a brief progress update if those sources change the planned
   rewrite.
4. Rewrite the complete prompt for each supported profile:
   - GPT-5.6 gets lean outcome-first instructions and freedom over routine
     execution.
   - Fable 5.1 gets literal steps, bounded scope and rewrites, useful batching,
     and progress guidance for long work.
   - Opus 5 gets the whole bounded specification, explicit output and
     delegation limits, and one required verification path.
5. Share scripts, references, assets, and `agents/openai.yaml` unless their
   runtime behavior differs. Point root `SKILL.md` at
   `variants/gpt-5.6.md` for repository discovery.
6. Run the materializer test. Exercise the changed skill independently under
   every affected profile and inspect the resulting behavior.

Done when every supported profile has one complete prompt, behavior is
equivalent across them, and installation loads only the chosen variant.

## New model

Add the model matcher and family rank, add its official guide reference, then
create its complete variant for every skill. Until coverage is complete, the
materializer selects the newest available same-family variant and reports the
fallback. Runtime skill prompts do not own fallback reporting.
