---
name: writing-for-agents
description: 'Use before creating or editing AGENTS.md, CLAUDE.md or any skill.'
metadata:
  source: https://github.com/mattpocock/skills
  source-path: skills/productivity/writing-for-agents
  source-revision: 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76
  sources: |
    - Informed by [pstack evaluation guidance](https://github.com/cursor/plugins/blob/2eb7ed4613cfc8f098dfe464a23680ea44d84c5e/pstack/skills/poteto-mode/playbooks/eval.md) — independent tasks, withheld criteria and artifact-based assessment.
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

For skill changes, edit `BASE.md` first, then make the same change in every variant under `variants/`, adapting it with each model's guide: [GPT-6](references/gpt-6.md), [Fable](references/claude-fable-5.1.md) or [Opus](references/claude-opus-5.5.md). Read [variants.md](references/variants.md) before changing variants or adding a model.

## Exercise changed instructions

Validate skill instructions through independent agent exercises and review, not deterministic tests of prose, headings, links or wording. Keep deterministic tests for executable scripts and machine-readable contracts. Don't write tests for linters; `validate:effect` runs them on this repository.

Give a fresh agent an ordinary task request without revealing the measured behavior, then judge its files or output against criteria recorded beforehand. Read [exercises.md](references/exercises.md) before running or comparing exercises.
