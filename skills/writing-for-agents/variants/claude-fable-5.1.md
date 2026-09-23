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

Read applicable skills and scoped AGENTS.md or CLAUDE.md instructions. Batch independent reads; consult linked documents when they govern the current decision. Resolve contradictions at their owner.

Link another owner's instruction where it applies; do not repeat its rules. Put guardrails beside the actions they govern. Keep short, routinely needed guidance inline. Route distinct workflows and substantial examples to references, saying when to read them. A separate skill needs a distinct job.

Record verified external origins, paths and known revisions in frontmatter metadata. Keep operational links in the body.

## Let tools handle mechanics

Show runnable commands by their installed names; leave options to command help. Use existing tools before building helpers. Put detection, routing, counters, scoring, limits and supported settings in scripts or configuration; keep prose for decisions and non-obvious context.

Describe the normal path before troubleshooting. Retain checks that prove the result or protect safety.

## Maintain the skill

Preserve invocation policy unless the user requests a change. Keep descriptions short and specific to the triggering action and artifact. Codex explicit-only skills use `policy.allow_implicit_invocation: false` in `agents/openai.yaml`; model-invoked skills omit it.

Keep every-turn skills in one file and `SKILL.md` within 500 lines. References may link only to their own `SKILL.md` among files under `skills/`, never to other references.

Finish authorized edits with targeted changes and report meaningful progress during long work. Keep edits in scope. Installation and model switching follow repository `INSTALL.md` and README; prompt edits authorize neither.

## Write for the consuming models

For shared instructions such as AGENTS.md or CLAUDE.md, use only the named target models' guides; otherwise stay model-neutral. These files need no variants.

For skills, read the human-owned, model-neutral `BASE.md` and relevant shared resources first, then the consuming models' guides: [Astra](references/gpt-6-astra.md), [Sol](references/gpt-6-sol.md), [Luna](references/gpt-6-luna.md), [Fable](references/claude-fable-5.1.md) or [Opus](references/claude-opus-5.md).

Change shared behaviour in the base first, then adapt every supported `variants/<profile>.md`. Existing variants show model-specific wording; they do not override the base. Preserve behaviour, permissions, exact commands, evidence and completion criteria. Model guidance adds no gates or delegation. Share resources and metadata unless runtime behaviour differs.

Keep a complete prompt at every profile path. Byte-identical variants should use relative symlinks to one regular file in the same `variants/` directory. Before a model-specific edit, replace its link with a copy; review all linked profiles when editing shared text. Keep `BASE.md` separate and root `SKILL.md` linked to `variants/gpt-6-astra.md`.

The applicable `AGENTS.md` assigns execution roles. Keep shared skills available to coordinators, reviewers and workers; variants adapt wording, not ownership or authority.

File presence, including these links, records coverage. The materializer copies the selected authored prompt; it does not generate text or call a model. Validate prompts against the base through independent agent exercises and installation through the materializer test.

For a new model, add its official guide and complete variants, then update matching and same-family rank in `scripts/materialize-skill-variants.mjs`. That script owns fallback and the once-per-session warning until coverage exists. Keep source links and review dates current.
