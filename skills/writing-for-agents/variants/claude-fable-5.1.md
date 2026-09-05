---
name: writing-for-agents
description: 'Write agent instructions using shared rules and guidance for the models that will read them.'
---

# Writing for agents

Identify the requested document and its consuming models, choose the matching
route below, then complete the scoped edits and validation.

Keep scope, permissions, required evidence, and completion explicit. Give each
rule one owner and remove contradictions before adding instructions. Define the
completed outcome; add intermediate gates only where order, permissions, or
recovery requires them. Preserve existing authorization and resolve routine
choices from the task and repository evidence.

## Choose the authoring route

- **Skills:** load `model-writing-guides` for the supported target profiles and
  [SKILL-MECHANICS.md](SKILL-MECHANICS.md) for invocation and layout. Maintain
  complete variants using the existing materializer; this router selects
  authoring guidance, not runtime skill files.
- **AGENTS.md, CLAUDE.md, or linked instructions:** keep shared rules independent
  of model and harness. Load `model-writing-guides` only when writing for named
  consuming models. Keep harness-specific rules in their owning configuration.

Choose guidance for the models that will read the result, even when another
model writes it. Infer targets from the request and repository configuration;
when none is specified, keep shared instructions model-neutral. Ask only when
an unresolved target would materially change the deliverable.

## Keep the result small and usable

Keep common constraints inline and disclose conditional procedures through
precise pointers. Keep references one hop from SKILL.md under the repository's
layout rules. Describe what a skill does and when to select it in its description;
put execution details in the body. Preserve
[upstream-license.md](references/upstream-license.md).

Finish the requested documents and preserve equivalent contracts across affected
profiles. Independently exercise changed skill decisions; use existing metadata
and materializer checks for packaging. Do not test prose with string matches.
Leave unrelated skills and installation settings alone unless their update is
part of the request.
