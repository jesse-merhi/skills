---
name: writing-for-agents
description: 'Write agent instructions using shared rules and guidance for the models that will read them.'
metadata:
  source: https://github.com/mattpocock/skills
  source-path: skills/productivity/writing-for-agents
  source-revision: 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76
---

# Writing for agents

Write for a capable colleague. Cut unnecessary ideas rather than packing them into denser sentences. Preserve the user's settled decisions and deliberate edits.

Define the outcome, evidence, completion criteria and decisions reserved for the user. Prescribe order only where it matters. Remove obsolete model workarounds without weakening checks or permissions.

## Write plainly

Use ordinary words and concrete actions. Introduce unfamiliar steps before referring to them. Keep specific standards and brief safety boundaries; cut obvious advice and speculative mistakes.

Let the name and description explain the purpose and triggers. Start the body with useful guidance. Use numbered stages when order matters and examples when they clarify a decision. Keep templates flexible unless an interface requires exact structure. Write paragraphs without manual line wrapping.

For example: "Explain what changed, why it matters, and show the result." Caption proof with what happened before and what happens now, not just "base" and "PR."

## Give each instruction one home

Read applicable skills and scoped AGENTS.md or CLAUDE.md instructions. Consult linked documents when they govern the current decision. Resolve contradictions at their owner.

Link another owner's instruction where it applies; do not repeat its rules. Put guardrails beside the actions they govern. Keep short, routinely needed guidance inline. Route distinct workflows and substantial examples to references, saying when to read them. A separate skill needs a distinct job.

Record verified external origins, paths and known revisions in frontmatter metadata. Keep operational links in the body.

## Let tools handle mechanics

Show runnable commands by their installed names; leave options to command help. Use existing tools before building helpers. Put detection, routing, counters, scoring, limits and supported settings in scripts or configuration; keep prose for decisions and non-obvious context.

Describe the normal path before troubleshooting. Retain checks that prove the result or protect safety.

## Maintain the skill

Preserve invocation policy unless the user requests a change. Keep descriptions short and specific to the triggering action and artifact. Codex explicit-only skills use `policy.allow_implicit_invocation: false` in `agents/openai.yaml`; model-invoked skills omit it.

Keep every-turn skills in one file and `SKILL.md` within 500 lines. References may link only to their own `SKILL.md` among files under `skills/`, never to other references.

Keep edits in scope. Installation and model switching follow repository `INSTALL.md` and README; prompt edits authorize neither.

## Write for the consuming models

For shared instructions such as AGENTS.md or CLAUDE.md, use only the named target models' guides; otherwise stay model-neutral. These files need no variants.

For skills, read the human-owned, model-neutral `BASE.md` and relevant shared resources first, then the applicable guide: [GPT-6](references/gpt-6.md), [Fable](references/claude-fable-5.1.md) or [Opus](references/claude-opus-5.5.md). Astra, Sol and Luna share one GPT-6 profile and complete prompt per skill.

Change shared behaviour in the base first, then adapt every supported `variants/<profile>.md`. Existing variants do not override the base. Preserve behaviour, permissions, exact commands, evidence and completion criteria. Model guidance adds no gates or delegation. Share resources and metadata unless runtime behaviour differs.

Keep a complete prompt at every profile path. Byte-identical variants should use relative symlinks to one regular file in the same `variants/` directory. Before a profile-specific edit, replace its link with a copy; review all consuming models when editing shared text. Keep `BASE.md` separate and root `SKILL.md` linked to `variants/gpt-6.md`.

The applicable `AGENTS.md` assigns execution roles. Keep shared skills available to coordinators, reviewers and workers; variants adapt wording, not ownership or authority.

File presence, including these links, records coverage. The materializer copies the selected authored prompt; it does not generate text or call a model. Validate prompts against the base through independent agent exercises and installation through the materializer test.

For a new model, verify its official guidance and update matching in `scripts/materialize-skill-variants.mjs`. Reuse the family profile when its guidance applies; add a guide and complete variants only when a distinct profile is needed. The script owns same-family fallback and the once-per-session warning. Keep source links and review dates current.
