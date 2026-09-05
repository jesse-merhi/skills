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

Maintain a complete skill prompt for every supported model while installing only
one selected workflow per invocation. Variant files are the coverage record;
there is no per-skill manifest or runtime model-routing hop.

Read the applicable guide references and fetch current official guidance before
changing those profiles:

- [GPT-5.6](references/gpt-5.6.md)
- [GPT-6 Astra](references/gpt-6-astra.md)
- [Claude Fable 5.1](references/claude-fable-5.1.md)
- [Claude Opus 5](references/claude-opus-5.md)

Before drafting, inspect existing variants/shared references and preserve the
behavior, permissions, ordered invariants, completion criteria, commands, and
evidence. Rewrite the complete `variants/<profile>.md` for every supported model:
lean outcome/constraints/proof for GPT-5.6; literal ordered, scoped execution for
Fable; context-led routine decisions, clear authority, and proportional checks
for Astra; bounded optional work/output, consolidated generic checks, and full
candidate discovery before filtering for Opus. Keep official links and review
dates in guide references instead of copying vendor manuals.

Share scripts, references, assets, and `agents/openai.yaml` unless runtime behavior
actually differs. Root SKILL.md points to `variants/gpt-5.6.md`; a harness view
contains the selected full file. Run the materializer test and independently
exercise each affected profile, judging behavior rather than heading/prose shape.
Done means complete equivalent coverage and a single directly loaded prompt.

For installation/switching from the repo root use
`./install-skills --harness codex --model astra` or
`./install-skills --harness claude --model opus`. `--require-exact` requires full
coverage; `--dry-run` inspects without writing. Rerun with another model to switch
that installation; use separate `--root` values for concurrent model installations.
The script changes skills, not the harness model or already-loaded history.

For a new model, add its exact matcher and same-family rank in
[scripts/materialize-skill-variants.mjs](scripts/materialize-skill-variants.mjs),
its official guide reference, and a full variant of every skill. Until covered,
the materializer chooses the newest available same-family variant and emits one
stale-profile notice per session. Keep the requested skill running; runtime
prompts do not own fallback reporting.
