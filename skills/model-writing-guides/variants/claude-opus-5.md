---
name: model-writing-guides
description: 'Maintain complete model-specific skill variants and add coverage when a new model or official prompting guide appears.'
---

# Model writing guides

Maintain complete, behaviorally equivalent skill prompts for every supported
model. Change only the requested skills and profiles, preserve their permission
and evidence contracts, and keep the installed `SKILL.md` as the already
selected prompt so no runtime router enters model context.

Before the first tool call, give one short sentence stating which skills and
profiles you will maintain. Update the user only for an important discovery or
change in direction. Lead the final response with the result and keep it
focused. Make each saved variant as short as its full workflow permits; omit
filler, duplicated explanations, and unused model guidance.

Run the named materializer test and behavioral exercises where this workflow
requires them; do not add a generic recheck. Use an independent evaluator for a
changed profile only when its behavioral exercise requires one and the user and
harness authorize delegation. Otherwise keep the rewrite in the current
session; do not spawn agents only to verify your own work.

## Complete specification

Current profiles and their official-guide summaries are:

- [GPT-5.6](references/gpt-5.6.md)
- [Claude Fable 5.1](references/claude-fable-5.1.md)
- [Claude Opus 5](references/claude-opus-5.md)

The executable profile registry and fallback order live in
[`scripts/materialize-skill-variants.mjs`](scripts/materialize-skill-variants.mjs).
The existence of `variants/<profile>.md` is the coverage record.

For each skill change:

1. Preserve one common behavior contract: outcome, permissions, hard ordering,
   completion criteria, commands, evidence, and shared resources.
2. Fetch the current official guide for each affected profile.
3. Rewrite the full variants, not adapters:
   - GPT-5.6: lean, outcome-first, one statement of each rule, routine choices
     left to the model.
   - Fable 5.1: literal ordered workflow, bounded scope and rewriting, explicit
     batching, progress, and current-source behavior where useful.
   - Opus 5: complete bounded brief, explicit output length and delegation
     limits, required verification stated once.
4. Keep scripts, references, assets, and `agents/openai.yaml` shared unless
   runtime behavior differs. Keep root `SKILL.md` linked to
   `variants/gpt-5.6.md` for repository discovery.
5. Run the materializer test and one independent behavioral exercise for each
   changed profile. Do not add deterministic tests of prompt wording.

Done when one installed skill invocation receives one complete model-specific
prompt and all variants still implement the same workflow.

When a new model appears, add its matcher, fallback rank, guide reference, and
complete variant across every skill. Before coverage is complete, the
materializer selects the newest same-family variant, owns the one-per-session
fallback notice, and keeps the requested skill running.
