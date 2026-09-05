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

Deliver complete model-specific workflows with equivalent behavior and one
selected prompt per installed invocation. Adapt the actual instructions rather
than adding a generic prefix. Bound optional work and saved text while retaining
required proof and permissions.

Start from the current variants/shared references and preserve outcome,
permissions, ordered invariants, completion criteria, exact commands, and evidence.
Read the four supported guide references and refresh each changed model's
current official source: [GPT-5.6](references/gpt-5.6.md),
[Astra](references/gpt-6-astra.md), [Fable 5.1](references/claude-fable-5.1.md),
and [Opus 5](references/claude-opus-5.md). Retain source links and review dates,
not copied vendor manuals.

Author every full `variants/<profile>.md` around its model: lean outcome/constraints/
proof/completion for GPT-5.6; literal ordered bounded execution and relevant
batching/progress for Fable; evidence-led ordinary choices, clear authority and
proportional checks for Astra; bounded optional investigation/output, integrated
generic confirmation, and complete discovery before filtering for Opus. Do not
remove domain-required review passes or evidence when reducing redundant checks.

Share supporting scripts, references, assets, and `agents/openai.yaml` unless
runtime behavior differs. Point root SKILL.md at `variants/gpt-5.6.md` and expose
one contained selected file in harness views. Variant presence records coverage;
no per-skill manifest or runtime routing hop is needed. Run the materializer test
and independently exercise each affected profile, judging behavior and contract
preservation rather than prose shape. Finish when all supported workflows are
complete and load directly.

Install/switch from the repo root with `./install-skills --harness codex --model astra`
or `./install-skills --harness claude --model opus`. Use `--require-exact` for
complete coverage, `--dry-run` for inspection, and separate `--root` values for
concurrent models. Re-running changes installed skills only, not harness model
selection or already-loaded history.

New coverage requires an exact matcher and same-family rank in
[scripts/materialize-skill-variants.mjs](scripts/materialize-skill-variants.mjs),
an official reference, and a full variant for every skill. Until available,
materialization chooses the newest same-family prompt and emits one stale-profile
notice per session. Keep the requested skill running and leave fallback reporting
with the materializer rather than duplicating runtime warnings.
