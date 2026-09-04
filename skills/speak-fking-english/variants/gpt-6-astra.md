---
name: speak-fking-english
description: 'Run before every final response: make it concise and clear, cut AI tells, re-pitch confusion, and use visuals only when they help.'
---

# Speak fking English

Make the complete draft clear enough to understand and use without recovering earlier context. Preserve the facts, scope, intended tone, material qualifications, evidence, and next action. Keep names, technical terms, quotations, code, commands, logs, and evidence character for character. This file contains the full writing workflow; no further instruction read is needed.

## Choose the necessary edit

Resolve the route from the request and audience without asking a routine clarification:

- Explicit invocation or a full unslop/de-slop/AI-tells request uses reader reset, visual filter, natural writing, deep catalogue, then final brevity. Discussion of the skill alone is not invocation.
- Implicit confusion or re-pitch uses reader reset, then final brevity.
- Implicit visual-support requests use visual filter, then final brevity.
- Other implicit uses, including every final-response check, use reader reset, visual filter, natural writing, then final brevity. Do not add the deep catalogue.

Apply only the selected sections in order. When a skill calls this one, return the draft to it for its audience; the call is implicit unless the user explicitly invoked this skill for that artifact. Make these edits before returning or saving the result.

## Reader reset

Find the missing premise and state it in one or two self-contained sentences. Explain the idea in everyday language before naming its technical term. Match the reader's demonstrated expertise, briefly define unfamiliar terms, and add a concrete example if it removes ambiguity. Use the applicable `CONTEXT.md` terminology, locating the correct area through `CONTEXT-MAP.md` when needed. Finish when the reader can understand or act without reconstructing the failed explanation and important nuance remains.

## Visual filter

Identify the reader's task and the objects involved. Choose prose unless another representation makes a concrete search or inference easier. The task may be exact lookup, comparison, change inspection, event tracing, relationship finding, pattern detection, or interface operation. A heading or several steps is not enough reason to draw.

Select the smallest useful form: numbered lists for ordered actions, bullets for unordered actions, each action self-contained; prose/list/table for exact values, commands, or stable comparisons; focused diff/before-after/concrete trace for changes; event trace/timeline for chronology, causality, or state transitions; shallow tree for hierarchy, ownership, or callers; relational diagram for topology, branches, feedback, boundaries, or handoffs; plot/map/interactive view for patterns, clusters, gaps, outliers, or spatial context; actual interface or realistic interactive UI for operator work; pseudocode/focused code for algorithms; actual proof-workflow screenshot/recording for real visual results.

A worked example should show how a concrete input becomes an outcome. A flow should expose needed order, branches, or handoffs. Require a spatial payoff from position, grouping, connections, scale, or interaction. Flatten a proposed diagram to a list first; if every necessary meaning survives, keep the list. Decorative boxes and arrows do not qualify.

When two materially different representations fit and could change understanding, render exactly two using the same facts. Change one meaningful choice and preserve labels, values, and scope. Compare spatial payoff, destination fit, and reading effort; show side by side when legible, otherwise stack. Keep the winner unless the reader owns that choice. Skip A/B for cosmetic variants or an evident best fit.

Inspect the output environment. Load native in-conversation visualization/UI guidance where available and prefer its inline output when interaction, filtering, progressive disclosure, spatial context, or a realistic operator view improves the explanation. In a CLI with browser or preview support, create/open the proper visual and give a short pointer. Use text-only prose, tables, diffs, traces, trees, or established/simple ASCII only when the meaning survives. If the needed interaction or spatial meaning cannot survive, disclose that limitation and provide the facts. Use native Markdown tables for compact records and Mermaid for diagrams requiring relational rendering. Do not fake application chrome with panels, badges, buttons, or decorative boxes, or create an artifact solely for polish.

Build from recognizable objects and real inputs, values, states, differences, and outcomes. Mark illustrative placeholders and preserve actual evidence. Before drawing, define one claim, named reader, destination size/medium, current or target state, mandatory facts, and details that can stay in prose. Default to one diagram.

Trace real actors, subsystems, inputs, stores, decisions, state changes, outputs, authority boundaries, and feedback. Make each primary step one actor's concrete action or decision, grouped by real owner or phase. Choose topology before styling. Put inputs beside their entry boundary, outputs beside producers, and decisions/stores/reviews/feedback/outcomes at actual handoffs. Equal nodes imply equal roles. Make start, focal relationship, decisions, feedback, and outcome easy to find; every row, axis, connector, position, and interaction must earn its place.

Use Mermaid DSL as the canonical relational source. Render it with native rich-output support or `mermaid-ascii` for fixed-width graph/sequence output. Treat generated output as authoritative rather than hand-spacing a copy. If it cannot represent the needed relationship, choose another format and explain why. Confirm layout survives the destination, or render that source with native UI.

Inspect the current render at destination size: one reader question answered, clear nouns, obvious focal relationship, branches terminated or rejoined, correct feedback direction, and no clipping, collision, or required zoom. Remove detail or redesign topology before reducing text size. Source validity is not visual validation. Visuals explain behavior; actual rendering, interaction, request/response, state, or operator outcomes prove execution. Keep support only if removing it makes the answer harder to understand or use, without duplicate prose or damaged evidence.

## Natural writing

Lead with outcome, meaning, and next action. Restore the necessary premise, then name actor, action, evidence, and tradeoff. Prefer observable mechanisms and plain words to abstractions. Introduce technical terms after their idea and use a focused example only when needed.

Remove stock transitions, throat-clearing, repetition, vague claims, excessive hedging, synonym cycling, and generic conclusions. Use active verbs and split sentences that need rereading. User-facing replies can express an evidence-backed opinion and natural first person, with varied rhythm. Reviewer-facing artifacts remain specific and candid without chatty asides. Keep headings and bold only where useful, use sentence case, and omit decorative emojis, em dashes, and curly quotes from your own prose. Preserve exact protected text. Finish when outcome, reasoning, evidence, and action are clear without missing context.

## Deep catalogue: only when explicitly selected

Identify all matches, rewrite them without changing meaning or tone, restore voice for the destination, and check what still sounds machine-generated. Keep this work internal; return the revised draft only.

Literal meanings, proper names, and exact text override catalogue substitutions. Keep attack surface/vector, test or agent harness, cryptographic primitive, vector index, `Primitive Obsession`, WCAG `Target Size (Enhanced)`, Cargo `[features]`, and other real named things. Do not collapse distinct actors such as `Job`, `Task`, and `Run`. Preserve quotations, bug-significant characters, and headings looked up by exact spelling; check before renaming. No prose rule permits renaming identifiers, configuration keys, or APIs.

1. Puffery: replace “pivotal moment,” “testament to,” or “evolving landscape” with the event.
2. Name-dropping: identify a source and its claim rather than listing publications.
3. Superficial “highlighting/ensuring/reflecting/showcasing/fostering” clauses: delete or replace with a factual, supported claim.
4. Promotional “vibrant/groundbreaking/renowned/stunning/must-visit” language: describe neutrally.
5. Vague attribution: name who said it or remove the sentence.
6. Formulaic “despite challenges, continues to thrive” stories: give the actual facts.
7. Padded vocabulary: remove additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, abstract landscape/tapestry, pivotal, showcase, testament, underscore, vibrant where they add no concrete meaning.
8. Ornate copulas: use “is/has” for “serves as/stands as/boasts/features.”
9. “Not just X, but Y”: state the point directly.
10. Forced threes: use the actual number of ideas.
11. Synonym cycling: use one consistent name per actor.
12. False ranges: list X and Y directly unless they share a scale.
13. Em dashes: use a period or comma, not parentheses, an en dash, or substitute hyphen.
14. Colons: keep for lists, examples, or labels; split decorative mid-sentence connectors.
15. Bold: reserve for what a skimmer needs, including literal controls.
16. Inline headers: remove bold label/colon repetition; a named lead-in ending in a period may introduce new detail.
17. Headings: sentence case except exact lookup contracts.
18. Emojis: remove decorative ones in headings or bullets.
19. Quotes: straight quotes in your own prose.
20. Chatbot phrases: remove “Certainly,” “I hope this helps,” “Let me know,” and “Found the smoking gun.”
21. Cutoff disclaimers: verify a source or remove the unsupported sentence.
22. Sycophancy: answer instead of “Great question” or “You're absolutely right.”
23. Filler: “to,” “because,” and no “it is important to note.”
24. Stacked hedges: state the actual uncertainty, such as “may.”
25. Generic endings: give the specific fact or plan.
26. Abstract metaphors: use concrete referents. Replace substrate with base; wedge with add; vague vector with way; design primitive with building block; metaphorical harness with the thing running work; surface with API/screen/diff; scaffolding with setup code; gold-plating with more than needed; ratchet with mechanism/tightening limit; evacuate with move out; endgame with last phase. Clarify locus, vantage, nexus, bedrock, modality, paradigm, north star, and flywheel too. Retain literal named senses, financial leverage, and named design properties.
27. Feelings as claims: state a mechanism, instruction, fact, or measured number. Remove project claims that could describe any project; deliberately portable instructions stay.
28. Dense sentences: separate ideas that require rereading.
29. Passive voice: name the actor when known and relevant.
30. Adverbs/weak verbs: use a stronger verb or measured delta. Never invent magnitude; state direction and measurement limits or remove the claim.
31. Fancy synonyms: use/help/many/if instead of padded utilize/leverage/facilitate/numerous/in the event that.

Specificity, varied rhythm, and honest complexity belong in all text. Replies to the user, including consult questions or explanations of review work, can also have opinions, natural “I,” and unforced structure. Reviewer-facing PR text, captions, commit subjects, verification steps, findings, and saved reports use the first three qualities without chatty additions. Separate the reply and artifact when both audiences are present. Finish with recognizable voice, no changed facts, and no unprotected catalogue patterns.

## Final brevity

Set the shortest complete length. Chat ceilings: 100 words for direct answer/decision/status, 200 for ordinary update/focused explanation, 400 for genuinely complex, multipart, or high-risk material. Exceed only for requested depth/format or necessary evidence, safety, compatibility, or actions. Never pad; keep required saved/reviewer artifact structure rather than imposing chat limits.

Each sentence must supply outcome, necessary context, evidence, material uncertainty/tradeoff, or an action. Cut unhelpful process narration, repeated conclusions, excess headings/lists, filler, stacked hedges, generic endings, and unsolicited offers of more work. Prefer prose for one or two points and lists when they improve scanning. Remove redundant examples.

Read once for usefulness and accuracy, protecting premise, proof, safety/compatibility warnings, and requested detail. Make no rewriting pass afterward. Return the draft alone or to its calling skill. Stop when another cut would remove something the reader needs.

Adapted from Matt Pocock `wait-what`, HumanLayer `show-me`, and pstack `unslop`. Keep [upstream licenses](references/upstream-licenses.md) as provenance; they are not a further writing pass.
