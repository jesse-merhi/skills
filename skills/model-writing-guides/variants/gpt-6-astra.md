---
name: model-writing-guides
description: 'Maintain complete model-specific skill variants and add coverage when a new model or official prompting guide appears.'
---

# Model writing guides

Keep each supported model's complete skill prompt aligned with its official
writing guide. An invocation receives one materialized prompt, not a routing
instruction. Resolve routine rewrite choices from the preserved contract and
source guidance; keep real authority boundaries intact.

## Establish the common contract and current guidance

Read existing variants and shared references before drafting. Preserve behavior,
permissions, ordered invariants, completion criteria, exact commands, and evidence.
Read and refresh official sources for each changed supported profile:
[GPT-5.6](references/gpt-5.6.md), [Astra](references/gpt-6-astra.md),
[Fable 5.1](references/claude-fable-5.1.md), and
[Opus 5](references/claude-opus-5.md). Store links/review dates in those references;
do not copy whole vendor manuals.

## Author the complete selected workflows

Write `variants/<profile>.md` for every supported model. GPT-5.6 gets one lean
outcome/constraint/evidence/completion/output contract. Fable gets literal steps,
bounded scope/rewrites, batching, and useful long-work updates. Astra gets context-
led routine decisions, reconciled instructions, preserved existing authorization,
and proportional verification. Opus gets bounded optional work and document
length, consolidated generic self-checks, and full candidate discovery before
filtering. Apply advice to the workflow, without new permission gates or blanket
delegation authority.

Share scripts, references, assets, and `agents/openai.yaml` unless runtime behavior
truly differs. Root SKILL.md links `variants/gpt-5.6.md`; harness views expose the
selected complete file. File presence is coverage, not a reason for a separate
manifest. Run the materializer test and independent exercises for each affected
profile. Complete when contracts remain equivalent and one full prompt loads directly.

## Install, switch, and extend coverage

Use `./install-skills --harness codex --model astra` or
`./install-skills --harness claude --model opus` from the repo root. Use
`--require-exact` for complete exact coverage, `--dry-run` to inspect, and separate
`--root` values for concurrent models. Rerunning switches that installation's
skills; it does not select the harness model or erase already-loaded history.

For a new model, add exact matcher and same-family rank in
[scripts/materialize-skill-variants.mjs](scripts/materialize-skill-variants.mjs),
an official guide reference, and full variants for all skills. Pending coverage,
the materializer uses the newest available same-family fallback and warns once
per session. Continue the requested skill; fallback reporting belongs to the
materializer, not repeated runtime prompt messages.
