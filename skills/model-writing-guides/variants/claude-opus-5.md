---
name: model-writing-guides
description: 'Maintain complete model-specific skill variants and add coverage when a new model or official prompting guide appears.'
---

# Model writing guides

Outcome: every repo skill has a complete prompt written for every supported
model, while each invocation receives only its selected workflow.

## Supported profiles

- GPT-5.6: read [gpt-5.6.md](references/gpt-5.6.md).
- GPT-6 Astra: read [gpt-6-astra.md](references/gpt-6-astra.md).
- Claude Fable 5.1: read
  [claude-fable-5.1.md](references/claude-fable-5.1.md).
- Claude Opus 5: read [claude-opus-5.md](references/claude-opus-5.md).

The profile definitions and same-family fallback order live in
[`scripts/materialize-skill-variants.mjs`](scripts/materialize-skill-variants.mjs).
Variant file presence is the coverage record; do not add a per-skill manifest.

## Create or update a skill

Adapt the relevant workflow steps rather than attaching a generic prefix. Distinguish redundant self-check scaffolding from required proof, bound optional work and document length, and preserve complete candidate discovery before filtering.

1. Read the current variants and shared references. Freeze the behavior,
   permissions, completion criteria, exact commands, and evidence requirements
   that must remain equivalent across models.
2. Fetch the current official prompting guide for every supported model whose
   variant will change. Keep links and review dates in the references above;
   do not copy whole vendor manuals.
3. Write a complete `variants/<profile>.md` for every supported profile:
   - GPT-5.6: state the outcome, constraints, evidence, completion criteria, and
     output shape once; leave routine execution choices open.
   - Fable 5.1: use literal, explicit steps; bound scope and rewrites; name
     batching, progress, and current-source lookup when they matter.
   - Astra: resolve routine choices from evidence, honor existing authority,
     reconcile conflicting guidance, and keep verification proportional.
   - Opus 5: bound optional work and document length, consolidate generic
     self-checks, and separate complete candidate discovery from filtering.
4. Keep supporting scripts, references, assets, and `agents/openai.yaml` shared
   unless their runtime behavior truly differs by model.
5. Point the skill's root `SKILL.md` symlink at `variants/gpt-5.6.md`.
   Harness views expose one contained selected file directly.
6. Run the materializer test and exercise the changed skill independently with
   each affected model profile. Judge behavior, not prose shape.

Done when all supported variants preserve one behavior contract, each model's
prompt removes guidance it does not need, and the installed skill loads one
complete variant with no model or network routing hop.

## Install or switch

Run `./install-skills --harness codex --model astra` or
`./install-skills --harness claude --model opus` from the repository root.
Use `--require-exact` to require complete model coverage and `--dry-run` to
inspect the installation first. Re-running with another model switches that
installation. Use a separate `--root` for concurrent model installations.
The command changes skills, not the harness model or conversation history.

## Add a new model

Add its exact matcher and same-family rank to the materializer, add its official
guide reference, and add a complete variant to every skill. Until that work is
complete, the materializer selects the newest available family variant and
emits one stale-profile notice per session. Keep the requested skill running.
