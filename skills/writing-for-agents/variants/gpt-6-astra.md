---
name: writing-for-agents
description: 'Write agent instructions using shared rules and guidance for the models that will read them.'
metadata:
  source: https://github.com/mattpocock/skills
  source-path: skills/productivity/writing-for-agents
  source-revision: 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76
---

# Writing for agents

Write as though you're explaining the job to a capable colleague. Remove unnecessary ideas rather than making sentences denser. Preserve the user's settled decisions and deliberate edits.

Define the requested outcome, required evidence, completion criteria, and decisions reserved for the user. Prescribe steps where order or a domain contract matters; leave routine execution choices to the agent. Remove obsolete model workarounds without weakening required checks or approval boundaries.

## Write plainly

- Use ordinary English and concrete actions. Introduce an unfamiliar step before referring to it.
- Tell the agent what to do. Keep meaningful permissions and safety boundaries brief; cut anti-pattern catalogues, obvious explanations, and speculative mistakes.
- Stay specific about requirements. Shortening an opinionated standard must not turn it into vague advice.
- Let the name and description explain the skill's purpose and triggers. Start the body with useful guidance instead of repeating them.
- Use brief numbered stages when order matters. Keep templates flexible: describe what a useful result needs, not a fixed sentence count or status vocabulary unless an interface requires it.
- Give practical examples and leave routine choices to the agent. Keep prose in paragraphs without manual line wrapping.

For example, write "Explain what changed, why it matters, and show the result" rather than assigning a purpose to each of four opening sentences. Caption proof with what happened before and what happens now, not just "base" and "PR."

## Give each instruction one home

Read applicable skills and scoped AGENTS.md or CLAUDE.md instructions. Consult linked documents when they govern the current decision. Resolve routine choices from these sources and contradictions at their owner; preserve decisions that require the user.

When another skill or reference owns an instruction, link it and stop. Do not repeat or paraphrase its rules beside the link. Put each link at the step that uses it, and each guardrail beside the action it governs.

Keep short, routinely needed guidance inline. Route distinct workflows and substantial examples to references, stating when each is needed rather than requiring every reference upfront. A standalone skill needs a distinct useful job; keep incidental steps with their owning workflow.

Record verified external origins, paths, and known revisions in frontmatter metadata so they can be refreshed. Keep operational links in the body.

## Let tools handle mechanics

Show the runnable command using its installed name. Let command help describe options instead of maintaining another manual or asking the agent to locate a skill directory.

Use existing tools before building helpers. Scripts and configuration should handle detection, routing, counters, scoring, limits, and supported invocation settings. Keep prose for decisions and non-obvious context.

Describe the normal path first. For example, check a provider CLI's version if an upload fails, rather than before every upload. Keep checks that establish the requested result or protect safety.

## Maintain the skill

Preserve existing invocation policy unless the user requests a change. Keep model-invoked descriptions short and front-load the action and artifact that trigger the skill, not a broad topic. In Codex, explicit-only skills use `policy.allow_implicit_invocation: false` in `agents/openai.yaml`; model-invoked skills omit that policy.

Keep every-turn skills in one file and `SKILL.md` within the repository's 500-line ceiling. References may link only to their own `SKILL.md` among files under `skills/`, not to other references.

Keep edits within the requested scope. Installation and model switching follow repository `INSTALL.md` and README; a prompt edit does not authorize either.

## Write for the consuming models

Use guidance for the models that will read the result, not the model writing it. For AGENTS.md, CLAUDE.md, or other shared instructions, read only the guides for named target models; otherwise stay model-neutral. Those documents do not require variants.

For skills, `BASE.md` is the human-owned, model-neutral source of truth. Read it and the shared resources first, then the applicable provider guidance: [GPT-5.6](references/gpt-5.6.md), [Astra](references/gpt-6-astra.md), [Fable](references/claude-fable-5.1.md), or [Opus](references/claude-opus-5.md).

Morph that base into a complete `variants/<profile>.md` prompt for each supported model. Use existing variants to compare model-specific wording, not to recover or override the base. Change shared behaviour in the base first; adapting a model's wording does not authorize rewriting the user's baseline.

Preserve behaviour, permissions, exact commands, evidence, and completion criteria across variants. Model guidance does not authorize extra gates or delegation. Share scripts, references, assets, and metadata unless runtime behaviour differs.

File presence records coverage. Keep root `SKILL.md` linked to `variants/gpt-5.6.md` for runtime discovery; it is not the base. The materializer selects an already-authored variant, not a generated base or a model call. Validate affected prompts against the base through independent agent exercises and validate installation with the materializer test.

For a new model, add its official guide and complete variants, then update the matcher and same-family rank in `scripts/materialize-skill-variants.mjs`. The materializer owns fallback and its once-per-session warning until coverage exists. Keep provider source links and review dates current.
