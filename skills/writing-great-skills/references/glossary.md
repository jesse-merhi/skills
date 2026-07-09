# Glossary: Building Great Skills

The domain model for what makes a skill great. A skill exists to wrangle
determinism out of a stochastic system; the root virtue is **Predictability**,
and every term below is a lever on it.

The terms are grouped by axis: **Invocation** (how a skill is reached),
**Information Hierarchy** (how its content is arranged), **Steering** (how the
agent's runtime behavior is shaped), and **Pruning** (how it is kept lean). Each
**failure mode** lives beside the lever that cures it, tagged _failure mode_.

**Bold terms** in any definition are themselves defined in this glossary.

## Predictability

The degree to which a skill makes the agent behave the same _way_ on every run:
the same process, not the same output. A brainstorming skill should predictably
diverge; its tokens vary, its behavior does not. The root virtue every other term
serves.

_Avoid_: consistency, reliability, robustness, output-determinism

## Invocation

How a skill is reached, and the two loads you pay for the choice.

### Model-Invoked

A skill that keeps its **description** field, so the agent can see it and fire
it autonomously. The human can still type its name, so model-invocation always
includes user reach. It pays a permanent **context load** on every turn in
exchange for discoverability. It is reachable by other skills because the
description makes it agent-discoverable.

Pick model-invocation only when the agent must reach the skill on its own. If it
never fires except by hand, drop model invocation and pay no context load.

_Avoid_: ability, tool, capability

### User-Invoked

A skill invisible to the agent and reachable only by the human typing its name.
It trades agent discoverability for zero **context load**. Because it has no
model-visible trigger, nothing but the human can reach it: no other skill can
fire it.

_Avoid_: procedure, workflow, command

### Description

The skill's machine-readable trigger, and the one **context pointer** a
**model-invoked** skill is forced to keep loaded at all times. Its presence is
the invocation axis: keep it and the skill is model-invoked; remove model
invocation and the skill is **user-invoked**.

_Avoid_: frontmatter, summary

### Context Pointer

A reference held in the agent's context that names some out-of-context material
and encodes the condition for reaching it. The **description** is the top-level
context pointer. Pointers to disclosed files are the same object one level down.
Its wording, not its target, decides when the agent reaches and how reliably.

_Avoid_: link, reference, import

### Context Load

The cost a **model-invoked** skill imposes on the agent's context window: its
**description**, always loaded, spending both tokens and attention. What
**user-invoked** skills escape, and the brake on splitting into more
model-invoked skills.

_Avoid_: token cost, context bloat

### Cognitive Load

The cost a **user-invoked** skill imposes on the human: what they must hold in
their head, which skills exist, and when to reach for each. It is the price of
human agency. Spend it where human judgment matters; remove it where it does
not.

_Avoid_: human index, burden, overhead

### Router Skill

A **user-invoked** skill whose job is to point at other user-invoked skills,
naming each and when to reach for it, so the human has one skill to remember
instead of many. It can only hint, never fire them.

_Avoid_: dispatcher, menu, registry, index, router procedure

### Granularity

How finely you divide skills. Finer division spends one of the two loads: more
**model-invoked** skills spend **context load**, while more **user-invoked**
skills spend **cognitive load**.

Two cuts guide division:

- By **invocation**, split off a model-invoked skill where you have a distinct
  **leading word** to trigger it.
- By **sequence**, split a run of **steps** where a step's
  **post-completion steps** need hiding.

_Avoid_: chunking, modularity

## Information Hierarchy

How a skill's content is arranged, and how far down the ladder each piece sits.

### Information Hierarchy

A skill's content ranked by how immediately the agent needs it. The rungs:

- **Steps**: in-file, primary
- **Reference**, in-file: secondary
- **Reference**, disclosed: behind a **context pointer**

When a skill has steps, in-file reference that should be disclosed buries them
and turns attending to them into a coin-flip. Keep the top of the ladder
legible; push down whatever you can.

_Avoid_: structure, organization, layout

### Steps

The ordered actions the agent performs. When a skill has them, they are the
primary tier of its content and the part that earns its place in `SKILL.md`.
Every step ends on a **completion criterion**.

_Avoid_: workflow, instructions, choreography

### Reference

Material the agent refers to on demand: definitions, facts, parameters,
examples, and conditional instructions. Reached via **context pointers**, and
the prime candidate for **progressive disclosure**.

_Avoid_: supporting material, docs, background

### External Reference

**Reference** that lives outside the skill system: a plain file, no
**description**, no **steps**, not invocable, that any skill can point at.

_Avoid_: doc, resource, knowledge base

### Progressive Disclosure

Moving **reference** down the ladder, out of `SKILL.md` and behind a
**context pointer**, so the top stays legible. It is licensed by **branching**:
disclose what only some branches need, inline what every path needs.

_Avoid_: lazy loading, chunking

### Co-location

Keeping the material an agent needs at once in one place: a concept's
definition, rules, and caveats under a single heading rather than scattered
across the file. Distinct from **Duplication**: duplication repeats one meaning
in two places; scattering fragments a single meaning across many.

_Avoid_: grouping, clustering, cohesion

### Sprawl

_Failure mode._ A skill that is simply too long, independent of whether the
lines are stale or repeated. The cure is the **information hierarchy**: push
**reference** down behind **context pointers**, and split by **branch** or
sequence so each path carries only what it needs.

_Avoid_: bloat, length, size, verbosity

## Steering

The levers that shape the agent's runtime behavior toward **Predictability**.

### Branch

A distinct way a skill can be invoked, so different runs take different paths
through it. A skill with many steps may carry many branches; a linear one has
none.

_Avoid_: path, case, fork

### Leading Word

A compact concept, also called a Leitwort, already living in the model's
pretraining, that the agent thinks with while running the skill. It encodes a
behavioral principle in the fewest possible tokens by invoking priors the model
already holds.

A leading word serves **predictability** twice. In the body it anchors
**execution**. In the **description** it anchors **invocation**. Word a
description with the leading words you actually use when you want the skill.

_Avoid_: keyword, term, motif

### Completion Criterion

The condition that tells the agent a unit of work is done. Its **clarity**
resists **premature completion**. Its **demand** sets **legwork**. The strongest
criteria are both checkable and exhaustive.

_Avoid_: done condition, exit condition, stopping rule

### Legwork

The work an agent does behind the scenes within a single step: reading files,
exploring the codebase, making changes, and digging up what it needs rather
than offloading to the user.

_Avoid_: scope, effort, diligence, coverage

### Post-Completion Steps

The **steps** that follow the current step. Visible, they pull the agent forward
into **premature completion**. The defense is to hide them by splitting the
sequence of steps into two.

_Avoid_: horizon, fog of war, lookahead

### Premature Completion

_Failure mode._ Ending the current step before it is genuinely done because the
agent's attention slips to being done rather than to the work. A tug-of-war
between visible **post-completion steps** and the **completion criterion**'s
clarity.

Sharpen the bound first. Only when the criterion is irreducibly fuzzy and you
observe the rush should you hide the later steps.

_Avoid_: premature closure, the rush, rushing, shortcutting

### Negation

_Failure mode._ Steering by prohibition names the behavior you are trying to
avoid and makes it easier for the agent to reproduce. A prohibition earns its
place only as a hard guardrail that cannot be phrased positively.

Cure it by stating the positive target behavior. When a guardrail must stay,
pair it with the behavior to perform instead.

_Avoid_: prohibition-first prompting, ironic rebound

### Negative Space

_Failure mode._ Omitted guidance still steers the agent because the missing
decision falls back to the agent's priors. This is not neutral; it is an
unreviewed branch.

Cure it by reading a draft for consequential silences. Fill the omission when
the skill needs a default, or make the choice an explicit branch when context
should decide.

_Avoid_: accidental omission, silent delegation

## Pruning

Keeping a skill lean, with each remedy paired with the failure it cures.

### Single Source Of Truth

The desired state where each meaning lives in exactly one authoritative place,
so a change to the skill's behavior is a change in one place.

_Avoid_: home, canonical location

### Duplication

_Failure mode._ The same meaning given more than one **single source of truth**.
It costs maintenance, costs tokens, and inflates prominence.

_Avoid_: repetition, redundancy

### Relevance

Whether a line still bears on what the skill does. A line loses relevance by
never bearing on the task or by going stale. Distinct from **No-Op**: relevance
asks whether a line bears on the task, not whether it changes behavior.

_Avoid_: load-bearing, staleness, freshness

### Sediment

_Failure mode._ Layers of old content that settle in a skill and are never
cleared because adding feels safe and removing feels risky.

_Avoid_: accretion, bloat, cruft, rot

### No-Op

_Failure mode._ An instruction that changes nothing because the model already
does it by default. The test: does a line change behavior versus the default?
A line can be relevant and still be a no-op.

_Avoid_: redundant instruction, restating the obvious, belaboring
