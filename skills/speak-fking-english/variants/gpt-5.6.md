---
name: speak-fking-english
description: 'Run before every final response: make it concise and clear, cut AI tells, re-pitch confusion, and use visuals only when they help.'
---

# Speak fking English

Return a clear, concise complete draft that preserves facts, scope, material qualifications, evidence, intended tone, and next actions. Make this the last edit before returning or saving it. Keep names, technical terms, quotations, code, logs, commands, and evidence character for character. All writing instructions are here; no reference read is needed.

## Select the work

- Explicit invocation or a full unslop/de-slop/AI-tells request: reader reset, visual filter, natural writing, deep catalogue, then final brevity. Merely discussing the skill is not invocation.
- Implicit confusion or re-pitch: reader reset, then final brevity.
- Implicit request for visual support: visual filter, then final brevity.
- Other model-selected uses, including the final-response checkpoint: reader reset, visual filter, natural writing, then final brevity. Skip the deep catalogue.

When another skill calls this one, return revised text to it for its chosen audience. That call is implicit unless the user explicitly invoked this skill for the artifact. Apply only the selected sections, in order.

## Reader reset

Identify the smallest missing premise and express it in one or two sentences that stand without the previous explanation. Lead with the idea in everyday language, then introduce its technical name. Match the reader's demonstrated expertise; briefly define unfamiliar terms and add a concrete example only when useful. Prefer established terms in the applicable `CONTEXT.md`; use `CONTEXT-MAP.md` to select among repository contexts. Done means the reader can understand or act without recovering the failed explanation, with important nuance intact.

## Visual filter

Start with the reader's task: exact lookup, comparison, change inspection, event tracing, relationship finding, pattern detection, or interface operation. Name the objects and the search or inference another representation would simplify. A topic, a heading, or several steps alone does not justify support. Use prose if there is no concrete gain.

Choose the smallest representation that carries the needed information:

- Ordered actions: numbered list; unordered actions: bullets, each with enough context to stand alone.
- Exact values, commands, or stable comparisons: prose, list, or table.
- Change: focused diff, before/after values, or one concrete trace.
- Chronology, causality, or state transition: event trace or timeline.
- Hierarchy, ownership, or callers: shallow tree.
- Branching, topology, feedback, boundaries, or handoffs: relational diagram.
- Patterns, clusters, gaps, outliers, or spatial context: plot, map, or interactive view.
- Operator workflow: actual interface or realistic interactive UI.
- Rule or algorithm: short pseudocode or focused code.
- Real visual result: actual screenshot or recording from the owning proof workflow.

Use a worked example for input-to-outcome mechanics and a flow only when order, branches, or handoffs matter. Require spatial payoff: position, grouping, connection, scale, or interaction must make a named search or inference easier. Before drawing, flatten the nodes into a list. If no needed relationship disappears, keep the list. Boxes and arrows that only decorate sequence add no meaning.

If two materially different representations fit and could change understanding, render exactly two from the same facts. Vary one meaningful decision, keep labels/values/scope consistent, and compare spatial payoff, destination fit, and reading effort. Place them side by side if legible, otherwise stack. Keep the winner unless the reader is deciding. Skip A/B for cosmetic choices or an obvious representation.

Inspect output capabilities before composing. Load and follow native in-conversation visualization/UI guidance when available; prefer its inline output when interaction, filtering, progressive disclosure, spatial context, or an operator view helps. A CLI with a browser or preview should create and open the proper visual and leave a short terminal pointer. In text-only output, use prose, tables, diffs, traces, trees, or conventional/simple ASCII only when meaning survives. If interaction or spatial meaning cannot survive, state the limitation and supply facts. Use Markdown tables for compact records and Mermaid when a relational diagram needs rendering. Do not fake application chrome with boxes, badges, or buttons or create an artifact just for polish.

Build from familiar objects and concrete inputs, values, states, differences, and outputs. Label illustrative placeholders; never invent evidence. For a diagram, first define one claim, reader, destination size/medium, current or target state, mandatory facts, and details that can remain prose. Default to one diagram. Trace real actors, subsystems, inputs, stores, decisions, state changes, outputs, authority boundaries, and feedback. Each primary step is one actor taking one concrete action or decision. Group by actual owner or phase.

Choose topology before styling. Put inputs at entry boundaries, outputs by their producer, and decisions/stores/reviews/feedback/outcomes at actual handoffs. Equal nodes must represent equal roles. Make the start and focal relationship easy to find. Every row, axis, connector, position, and interaction must carry needed meaning.

Use Mermaid DSL as canonical source for relational diagrams: native rendering on rich outputs and `mermaid-ascii` for fixed-width graph/sequence output. Use generated output rather than hand-spacing an equivalent. If Mermaid cannot express the relationship, explain the alternative. Verify destination layout or render that source with native UI.

Inspect the current render at destination size. Check one clear reader question, recognizable nouns, obvious focal relationship, terminating/rejoining branches, correctly directed feedback, and no clipping, collisions, or required zoom. Redesign topology or remove detail before shrinking text. Source validity is not visual proof. A diagram explains behavior; actual rendering, interaction, request/response, state, or operator outcome proves execution. Remove support if the answer remains equally usable without it. Done means useful support without duplicated prose or weakened evidence.

## Natural writing

Lead with outcome, meaning, and next action. Restore missing context and name the actor, action, evidence, and tradeoff. Prefer concrete mechanisms, plain words, active verbs, and one focused example when ambiguity remains. Cut throat-clearing, repetition, vague claims, stacked hedges, synonym cycling, and generic conclusions. Split sentences that require rereading.

For user-facing replies, be specific, react to facts, use first person naturally, vary rhythm, and allow an unforced voice. For reviewer-facing artifacts, stay specific and candid without chatty asides. Use only useful structure, necessary bold, and sentence-case headings. Keep decorative emojis, em dashes, and curly quotes out of your own prose, preserving exact protected text. Done means the reader understands outcome, reasoning, evidence, and action without reconstructing context.

## Deep catalogue: explicit route only

Identify every match below, rewrite each while preserving meaning and tone, add destination-appropriate voice, then check for remaining machine-like phrasing. Do not return the scan as extra commentary.

Rules target padding, not literal senses or owner-given names. Keep attack surface/vector, test or agent harness, cryptographic primitive, vector index, `Primitive Obsession`, WCAG `Target Size (Enhanced)`, Cargo `[features]`, and other real technical names. Keep distinct actors such as `Job`, `Task`, and `Run` distinct. Preserve quotations and bug-significant characters exactly, including punctuation. These rules never authorize renaming identifiers, configuration keys, APIs, or exact lookup headings; check before changing a heading.

1. Replace puffery such as “pivotal moment,” “testament to,” and “evolving landscape” with what happened.
2. Replace publication name-dropping with a named source and what it said.
3. Cut superficial “highlighting/ensuring/reflecting/showcasing/fostering” tails or make them concrete claims supported by facts or sources.
4. Replace promotional “vibrant/groundbreaking/renowned/stunning/must-visit” language with neutral description.
5. Name the source behind “experts believe” or cut the attribution.
6. Replace formulaic “despite challenges, continues to thrive” narratives with specifics.
7. Remove padded vocabulary: additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, abstract landscape/tapestry, pivotal, showcase, testament, underscore, vibrant.
8. Use “is” or “has” instead of ornate “serves as,” “stands as,” “boasts,” or “features.”
9. State the point directly instead of “not just X, but Y.”
10. Use the natural number of ideas, not a forced group of three.
11. Repeat one name for one actor rather than cycling synonyms.
12. Replace “from X to Y” with a direct list when no shared scale exists.
13. Replace em dashes with a period or comma, not a parenthetical, en dash, or substitute hyphen.
14. Keep colons for lists, examples, and labels; split clauses joined by a decorative mid-sentence colon.
15. Bold only what skimmers need, including literal controls when useful.
16. Remove bold label/colon bullets that repeat themselves; a named lead-in ending in a period may introduce genuinely new detail.
17. Use sentence-case headings unless exact spelling is a lookup contract.
18. Remove decorative heading/bullet emojis.
19. Use straight quotes in your own prose.
20. Cut chatbot openings/endings such as “Certainly,” “I hope this helps,” “Let me know,” and “Found the smoking gun.”
21. Replace cutoff disclaimers with a verified source or remove the unsupported sentence.
22. Cut praise such as “Great question” or “You're absolutely right”; answer directly.
23. Use “to” for “in order to” and “because” for “due to the fact that”; delete “it is important to note.”
24. Replace stacked hedges with the actual uncertainty, such as “may.”
25. Replace generic conclusions with the specific fact or plan.
26. Replace vague metaphor nouns with concrete things: substrate→base; wedge→add; vague vector→way; design primitive→building block; metaphorical harness→the thing running work; surface→API/screen/diff; scaffolding→setup code; gold-plating→more than the job needs; ratchet→mechanism or tightening limit; evacuate→move out; endgame→last phase. Likewise clarify locus, vantage, nexus, bedrock, modality, paradigm, north star, and flywheel. Literal named uses stay, including financial leverage and a named design property.
27. State what the mechanism does, not how it feels. Use an instruction, fact, or measured number. Cut project claims interchangeable with any project's documentation; portable instructions remain valid.
28. Split dense sentences into one understandable idea at a time.
29. Prefer active voice and name the actor; passive is appropriate when the actor is unknown or irrelevant.
30. Replace weak verbs/adverbs with a stronger verb or measured delta. Never invent magnitude; report direction with measurement limits or cut the claim.
31. Prefer use/help/many/if to padded utilize/leverage/facilitate/numerous/in the event that.

All destinations need specificity, varied rhythm, and honest complexity. User-facing replies, including consult questions and explanations of review work, may also have opinions, natural “I,” and loose human structure. Reviewer-facing PR titles/bodies, captions, commits, verification steps, finding cards, and saved reports use the first three qualities without chatty additions. Split chat and saved artifact when both audiences exist. Done means no unprotected catalogue pattern remains, no fact changed, and the text has a recognizable voice.

## Final brevity

Use the shortest complete form. Chat ceilings are 100 words for a direct answer/decision/status, 200 for an ordinary update/focused explanation, and 400 for genuinely complex, multipart, or high-risk material. Exceed only for requested depth/format or necessary evidence, safety, compatibility, or actions. Never pad to a ceiling. Preserve required structure in saved/reviewer artifacts instead of applying chat limits.

Keep sentences that supply outcome, needed context, evidence, material uncertainty/tradeoff, or required action. Cut unverifiable process narration, repeated outcomes, unnecessary headings/lists, filler, stacked hedges, generic endings, and offers of more work. Prefer prose for one or two points, and lists only for easier scanning. Remove examples that repeat a clear explanation.

Read once for usefulness and accuracy. Preserve premise, proof, safety/compatibility warnings, and requested detail. Do not run another rewriting pass. Return the revised draft alone, or to the calling skill for its audience. Done means further cutting would remove something the reader needs.

Attribution: adapted from Matt Pocock `wait-what`, HumanLayer `show-me`, and pstack `unslop`. Retain [upstream licenses](references/upstream-licenses.md); they are provenance, not another writing pass.
