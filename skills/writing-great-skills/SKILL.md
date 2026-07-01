---
name: writing-great-skills
description: 'Reference for writing and editing skills well: invocation choices, information hierarchy, progressive disclosure, leading words, pruning, and failure modes.'
---

# Writing Great Skills

Use this as a user-invoked reference when creating, editing, or reviewing agent
skills. It explains the vocabulary and principles that make a skill
predictable.

This skill is adapted from Matt Pocock's `writing-great-skills` skill. Keep it
explicit-only: the original uses `disable-model-invocation: true`, and this repo
represents that with `agents/openai.yaml` policy.

Bold terms are defined in [glossary.md](references/glossary.md). Load the
glossary when a term needs its full meaning or when reviewing a skill against
the vocabulary. The upstream MIT license notice is in
[upstream-license.md](references/upstream-license.md).

## Root Principle

A skill exists to wrangle determinism out of a stochastic system.
**Predictability** is the root virtue: the agent taking the same process every
run, not producing the same output. Every lever below serves predictability.

## Invocation

Two choices trade different costs:

- A **model-invoked** skill keeps a **description**, so the agent can fire it
  autonomously and other skills can reach it. It contributes to **context load**:
  the description sits in the window every turn.
- A **user-invoked** skill strips the description from the agent's reach: only
  the user, typing its name, can invoke it. It has zero context load, but spends
  **cognitive load** because the user must remember it exists.

Pick model-invocation only when the agent must reach the skill on its own, or
another skill must. If it only ever fires by hand, make it user-invoked and pay
no context load.

When user-invoked skills multiply past what a person can remember, cure the
piled-up cognitive load with a **router skill**: one user-invoked skill that
names the others and when to reach for each.

## Writing The Description

A model-invoked **description** does two jobs: state what the skill is, and list
the **branches** that should trigger it. Every word increases **context load**,
so a description earns even harder pruning than the body:

- Front-load the skill's leading word.
- Use one trigger per branch. Synonyms that rename a single branch are
  **duplication**.
- Cut identity that is already in the body. Keep the description to triggers,
  plus any reach clause for other skills.

## Information Hierarchy

A skill is built from two content types, **steps** and **reference**, arranged by
how immediately the agent needs the material:

1. **In-skill step**: an ordered action in `SKILL.md`. Each step ends on a
   checkable **completion criterion**.
2. **In-skill reference**: a definition, rule, or fact in `SKILL.md`.
3. **External reference**: reference pushed out of `SKILL.md` into a separate
   file, reached by a **context pointer** and loaded only when the pointer fires.

Push too little down and the top bloats. Push too much down and you hide
material the agent actually needs.

**Progressive disclosure** is the move down the ladder: out of `SKILL.md` into a
linked file. Branching is the cleanest disclosure test: inline what every branch
needs, and push behind a pointer what only some branches reach.

Where the ladder decides how far down a piece sits, **co-location** decides what
sits beside it. Keep a concept's definition, rules, and caveats under one
heading rather than scattered.

## When To Split

**Granularity** is how finely you divide skills. Each cut spends one of two
loads, so split only when the cut earns it:

- **By invocation**: split off a model-invoked skill when there is a distinct
  **leading word** that should trigger it on its own, or another skill must
  reach it.
- **By sequence**: split a run of **steps** when the steps still ahead tempt the
  agent to rush the one in front of it (**premature completion**).

## Pruning

Keep each meaning in a **single source of truth** so changing behavior is a
one-place edit.

Check every line for **relevance**: does it still bear on what the skill does?

Then hunt **no-ops** sentence by sentence. Run the no-op test on each sentence in
isolation; when one fails, delete the whole sentence rather than trim words from
it.

## Leading Words

A **leading word** is a compact concept already living in the model's
pretraining that the agent thinks with while running the skill. It serves
predictability twice:

- In the body, it anchors execution.
- In the description, it anchors invocation.

Hunt for opportunities to refactor skills to use leading words. A triad spelled
out at three sites, or a description spending a sentence to gesture at one idea,
may collapse into a single token.

Examples:

- "fast, deterministic, low-overhead" -> _tight_
- "a loop you believe in" -> _red_

## Failure Modes

Use these to diagnose issues the user may be having with a skill:

- **Premature completion**: ending a step before it is genuinely done.
- **Duplication**: the same meaning in more than one place.
- **Sediment**: stale layers that settle because adding feels safe and removing
  feels risky.
- **Sprawl**: a skill too long, even when every line is live and unique.
- **No-op**: a line the model already obeys by default, so you pay load to say
  nothing.
