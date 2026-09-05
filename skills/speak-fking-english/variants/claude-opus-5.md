---
name: speak-fking-english
description: 'Improve substantial writing, requested rewrites, or unclear explanations with concise, concrete language.'
---

# Speak fking English

Edit the complete draft into clear, concrete language for its destination. Preserve facts, scope, tone, material qualifications, evidence, and next actions. Keep names, technical terms, quotations, code, commands, logs, and evidence character for character. The complete writing contract is inline; no further instruction file is required.

## Scope and route

Choose one route and apply its sections in order:

- Explicit invocation or full unslop/de-slop/AI-tells request: reader reset, visual filter, natural writing, deep catalogue, final brevity. Discussion of the skill is not invocation.
- Implicit confusion/re-pitch: reader reset, final brevity.
- Implicit visual support: visual filter, final brevity.
- Other selected uses, including substantial writing or a required delivery pass: reader reset, visual filter, natural writing, final brevity. Omit the deep catalogue.

A calling skill receives revised text for its audience, not a separate user response. Treat its call as implicit unless the user explicitly invoked this skill for the artifact. Keep work inside the selected route and make it the last edit before return or save; do not add an unrelated verification round.

## Reader reset

Find the missing premise and state it in one or two sentences independent of the failed explanation. Explain the idea plainly before its technical name. Match demonstrated expertise, briefly define unfamiliar terms, and use a concrete example when it removes ambiguity. Prefer terminology from the applicable `CONTEXT.md`, selected through `CONTEXT-MAP.md` when the repository has multiple contexts. Finish when the reader can understand or act with necessary nuance intact.

## Visual filter

Name the reader's task, objects, and the search or inference support would simplify: exact lookup, comparison, change inspection, event sequence, relationship, pattern, or interface operation. Choose prose when there is no concrete gain. Several steps, files, or components do not justify a visual on their own.

Use the smallest suitable form:

- Self-contained numbered actions for ordered work, bullets for unordered work.
- Prose/list/table for precise values, commands, or stable comparisons.
- Focused diff, before/after values, or concrete trace for changes.
- Event trace/timeline for chronology, causality, or state transitions.
- Shallow tree for hierarchy, ownership, or caller relationships.
- Relational diagram for topology, branching, feedback, boundaries, or handoffs.
- Plot/map/interactive view for patterns, clusters, gaps, outliers, or spatial context.
- Actual interface or realistic interactive UI for an operator workflow.
- Focused code or short pseudocode for an algorithm/rule.
- Actual owning-proof-workflow screenshot/recording for a visual result.

A worked example should show concrete input becoming output. Use a flow only for needed order, branching, or handoffs. Require position, grouping, connection, scale, or interaction to make a named inference easier. Flatten proposed nodes into a list before drawing; keep that list unless it loses a relationship the reader needs. Decorative lanes, boxes, and arrows do not count.

When the representation is genuinely ambiguous and could change understanding, render exactly two candidates from the same facts. Vary one meaningful choice, preserving labels, values, and scope. Compare spatial payoff, destination fit, and reading effort; display side by side if legible, otherwise stack. Keep the winner unless the reader is choosing. Do not A/B cosmetic variations or an already clear choice.

Inspect output capabilities first. Load native visualization/UI guidance when available and prefer its inline output for useful interaction, filtering, progressive disclosure, spatial context, or realistic operator work. A CLI with a browser/preview should create and open the proper visual and give a short terminal pointer. In text-only output, use prose, tables, diffs, traces, trees, or conventional/simple ASCII only when meaning survives. Otherwise disclose the missing spatial/interactive capability and give the facts. Markdown tables suit compact records; Mermaid suits relational diagrams that need rendering. Do not fake application chrome with decorative boxes, panels, badges, or buttons, or create an artifact solely for polish.

Build from recognizable objects and concrete inputs, values, states, changes, and outputs. Label illustrative placeholders; do not invent evidence. Before a diagram, define one claim, reader, destination size/medium, current or target state, mandatory facts, and details that can stay in prose. Default to one diagram.

Trace real actors, subsystems, inputs, stores, decisions, state changes, outputs, authority boundaries, and feedback. Each primary step is one actor's concrete action or decision; group by real owner or phase. Choose topology before styling. Put inputs at entry boundaries, outputs beside producers, and decisions/stores/reviews/feedback/outcomes at real handoffs. Equal nodes imply equal roles. Make start, focal relationship, decisions, feedback, and outcome easy to find. Every row, axis, connector, position, and interaction must carry needed meaning.

Use Mermaid DSL as canonical source for relational diagrams, native rendering for rich destinations, and `mermaid-ascii` for fixed-width graph/sequence layouts. Use generated output rather than hand-spacing a copy. If Mermaid cannot express the relationship, explain the chosen alternative. Confirm destination layout or render the same source through native UI.

Inspect the current render at destination size. It must answer one reader question with clear nouns, obvious focal relationship, branches that terminate or rejoin, correctly directed feedback, and no clipping, collisions, or required zoom. Redesign topology or remove detail rather than shrinking text. Source validity is not visual proof. A visual explains behavior; actual rendering, interaction, request/response, state, or operator outcomes prove execution. Remove support if usability is unchanged without it. Completion requires useful support, no duplicated prose, and intact evidence.

## Natural writing

Lead with the outcome, meaning, and next action. Restore necessary context; name actor, action, evidence, and tradeoff. Prefer plain words and concrete mechanisms, introducing technical terms after their idea. Add a focused example only when needed.

Cut throat-clearing, repetition, filler, vague claims, stacked hedges, synonym cycling, and generic conclusions. Use active verbs and split dense sentences. For user-facing replies, be specific, offer evidence-backed opinions where useful, use first person naturally, and vary rhythm. Reviewer-facing artifacts remain specific and candid without chatty asides. Keep only useful headings/bold, use sentence case, and omit decorative emojis, em dashes, and curly quotes in your own prose. Protected exact text stays unchanged. Finish when the reader understands outcome, reasoning, evidence, and action without rebuilding context.

## Deep catalogue: explicit route only

Find every relevant match before editing; do not let a short output budget hide a genuine problem. Rewrite the matches, restore destination-appropriate voice, and inspect for remaining machine-like phrasing as part of this pass. Keep the scan internal.

Rules apply to padding, not literal terms, proper names, or reproduced text. Preserve attack surface/vector, test or agent harness, cryptographic primitive, vector index, `Primitive Obsession`, WCAG `Target Size (Enhanced)`, Cargo `[features]`, and other real names. Keep distinct things such as `Job`, `Task`, and `Run` distinct. Preserve quoted wording, bug-significant characters, and exact lookup headings; check before renaming a heading. Never rename identifiers, config keys, or APIs under a prose rule.

1. Replace puffery such as “pivotal moment,” “testament to,” and “evolving landscape” with events.
2. Replace publication name-dropping with a source and its actual claim.
3. Delete superficial “highlighting/ensuring/reflecting/showcasing/fostering” clauses or make them specific supported claims.
4. Replace promotional “vibrant/groundbreaking/renowned/stunning/must-visit” language with neutral description.
5. Name the source behind vague attribution or cut it.
6. Replace “despite challenges, continues to thrive” formulas with facts.
7. Remove padded additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, abstract landscape/tapestry, pivotal, showcase, testament, underscore, vibrant.
8. Use “is/has” for ornate “serves as/stands as/boasts/features.”
9. State the point without “not just X, but Y.”
10. Use the natural number of ideas, not a forced three.
11. Use one stable name per actor instead of synonym cycling.
12. List topics directly rather than a false “from X to Y” scale.
13. Replace em dashes with periods or commas, not parentheses, en dashes, or substitute hyphens.
14. Keep colons for lists, examples, or labels; split decorative clause connectors.
15. Bold only essential skimming targets, including literal controls where useful.
16. Remove bold label/colon repetition. A named lead-in ending in a period can introduce new detail.
17. Use sentence-case headings except exact lookup contracts.
18. Remove decorative heading/bullet emojis.
19. Use straight quotes in your own prose.
20. Cut “Certainly,” “I hope this helps,” “Let me know,” “Found the smoking gun,” and similar chatbot phrases.
21. Replace cutoff disclaimers with verified sources or remove unsupported claims.
22. Answer directly instead of “Great question” or “You're absolutely right.”
23. Shorten filler to “to” and “because”; remove “it is important to note.”
24. Replace stacked hedges with the actual uncertainty, such as “may.”
25. End with the specific fact or plan, not a generic conclusion.
26. Replace vague metaphors: substrate→base; wedge→add; vague vector→way; design primitive→building block; metaphorical harness→the thing running work; surface→API/screen/diff; scaffolding→setup code; gold-plating→more than needed; ratchet→mechanism/tightening limit; evacuate→move out; endgame→last phase. Clarify locus, vantage, nexus, bedrock, modality, paradigm, north star, and flywheel. Keep literal senses, financial leverage, and named design properties.
27. Replace feelings with mechanisms, instructions, facts, or measured numbers. Cut project claims interchangeable with any project's documentation; portable instructions remain.
28. Split dense sentences into understandable ideas.
29. Prefer active voice with the known relevant actor; passive is fine when the actor is unknown or irrelevant.
30. Replace weak verbs/adverbs with stronger verbs or measured deltas. Never invent magnitude; state direction and measurement limits or cut the claim.
31. Prefer use/help/many/if to padded utilize/leverage/facilitate/numerous/in the event that.

All text needs specificity, varied rhythm, and candid complexity. Replies spoken to the user, including consult questions and discussion of review work, may also have opinions, natural “I,” and unforced structure. Reviewer-facing PR titles/bodies, captions, commit subjects, verification steps, finding cards, and saved reports use the first three qualities without chatty additions. Split reply and artifact when both audiences exist. Finish with no unprotected catalogue matches, no changed facts, and recognizable voice.

## Final brevity

Set length for the destination. Chat ceilings: 100 words for a direct answer/decision/status; 200 for an ordinary update/focused explanation; 400 for genuinely complex, multipart, or high-risk content. Exceed only for requested depth/format or necessary evidence, safety, compatibility, or actions. Never pad to a ceiling. Saved/reviewer artifacts should be concise while retaining their required structure, not squeezed into chat limits.

Keep only sentences that supply outcome, necessary context, evidence, material uncertainty/tradeoff, or required action. Remove unhelpful process narration, repeated conclusions, unnecessary headings/lists, filler, stacked hedges, generic endings, and offers of more work. Prefer prose for one or two points; use lists when they improve scanning. Remove examples that merely repeat a clear point.

Read once for accuracy and usefulness. Preserve premise, proof, safety/compatibility warnings, and requested detail. Do not run another rewriting pass. Return the draft alone or to the calling skill. Done means further cutting would remove meaning the reader needs.

Adapted from Matt Pocock `wait-what`, HumanLayer `show-me`, and pstack `unslop`. Preserve [upstream licenses](references/upstream-licenses.md) as provenance, not another writing step.
