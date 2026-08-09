# Skill Mechanics

Use these rules when the document being written is a skill. Use
[SKILL.md](SKILL.md) for the writing principles shared by every agent-facing
document.

## Invocation

Choose between two invocation modes:

- **Model-invoked**: keep the skill visible to the model so it can fire
  autonomously and other skills can reach it. Pay permanent context load for
  the description. The user can still invoke it directly.
- **User-invoked**: hide the skill from implicit model discovery and require the
  human to invoke it. Pay cognitive load instead of permanent context load.

Choose model invocation only when the model or another skill must reach the
skill without the human naming it. Use harness-specific metadata to enforce the
choice. In Codex, set `policy.allow_implicit_invocation: false` in
`agents/openai.yaml` for user-invoked skills; omit that policy for model-invoked
skills.

For a model-invoked skill, make the frontmatter description a precise context
pointer: state what the skill does and name each distinct trigger branch. For a
user-invoked skill, keep the human-facing summary short because the model does
not use it for implicit triggering.

## Splitting By Invocation

Split off a model-invoked skill only when it has a distinct leading word that
should trigger independently or another skill must reach it. The new always-
loaded description must earn its context cost.

Split a sequence when visible later steps repeatedly cause premature
completion and a sharper completion criterion has not fixed it. The split must
cross a real context boundary; an inline call leaves the later steps visible.

## Router Skills

When user-invoked skills multiply beyond what a person can remember, create one
user-invoked router that names them and explains when to reach for each. The
router reduces cognitive load but does not invoke hidden skills on the user's
behalf.
