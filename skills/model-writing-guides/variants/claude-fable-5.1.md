---
name: model-writing-guides
description: 'Adapt agent instructions for target models and maintain complete skill variants.'
---

# Model writing guides

For AGENTS.md, CLAUDE.md, or linked instructions, use only the guides for the
models that will consume the document, not the authoring model. Keep shared
instructions model-neutral when no target is named. The variant and installer
workflow below applies to skills; editing other documents does not require
creating variants or switching the installation.

Write full skill prompts for every supported model. Each installed invocation
loads one selected prompt directly; do not make the agent route to another file.

1. Read current variants and shared references. Record the common outcome,
   permissions, ordered invariants, completion criteria, exact commands, and
   evidence before editing.
2. Read the supported profiles' references and fetch current official guidance:
   [GPT-5.6](references/gpt-5.6.md), [GPT-6 Astra](references/gpt-6-astra.md),
   [Fable 5.1](references/claude-fable-5.1.md), and
   [Opus 5](references/claude-opus-5.md). Batch independent guide reads. Look up
   unfamiliar/version-sensitive claims as written. Keep source links and review
   dates in these references, not whole copied manuals.
3. Rewrite each complete `variants/<profile>.md`. Give GPT-5.6 lean outcomes,
   constraints, evidence, completion, and output. Give Fable literal ordered
   instructions with bounded scope/rewrites and useful batching/progress. Give
   Astra context-led routine choices, clear precedence/authority, and proportional
   verification. Give Opus bounded optional work/document length, consolidated
   generic checks, and complete candidate discovery before filtering.
4. Share scripts, references, assets, and `agents/openai.yaml` unless runtime
   behavior differs. Point root SKILL.md at `variants/gpt-5.6.md`; materialized
   views contain a selected full file. Variant presence records coverage; do
   not add per-skill manifests.
5. Run the materializer test and independently exercise each affected profile.
   Inspect behavior and preserved contracts, not just prose or file presence.
   Finish every affected variant and required validation; report meaningful
   source/evidence changes during long work.

Install from the repo root with `./install-skills --harness codex --model astra`
or `./install-skills --harness claude --model opus`. Add `--require-exact` for
complete exact coverage and `--dry-run` for inspection. Rerun with another model
to switch; separate `--root` values isolate concurrent model installations.
Select the actual model in the harness too: this command changes skills, not
model settings or existing conversation history.

When adding a model, update its matcher and same-family rank in
[scripts/materialize-skill-variants.mjs](scripts/materialize-skill-variants.mjs),
add its official reference, and write a full variant for every skill. Until
coverage exists, materialization uses the newest available same-family prompt
and reports stale coverage once per session. Continue the requested skill with
that fallback; runtime prompts do not repeat the installer-owned warning.
