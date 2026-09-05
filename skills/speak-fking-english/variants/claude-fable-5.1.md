---
name: speak-fking-english
description: 'Improve substantial writing, requested rewrites, or unclear explanations with concise, concrete language.'
---

# Speak fking English

Edit the complete draft for its reader. Preserve facts, scope, qualifications, intended tone, evidence, and next actions. Keep names, technical terms, quotations, code, logs, commands, and evidence exactly as written. This file contains the writing workflow; do not load another instruction file for it.

## 1. Select a route

Use only the sections named by the matching route, in this order:

- Explicit invocation or full unslop/de-slop/AI-tells request: steps 2, 3, 4, 5, 6. A discussion about this skill alone is not invocation.
- Implicit confusion or request to re-pitch: steps 2 and 6.
- Implicit request for visual support: steps 3 and 6.
- Other selected uses, including substantial writing or a required delivery pass: steps 2, 3, 4, 6. Skip step 5.

If another skill calls this one, return the revised draft to that skill for its audience. Treat the call as implicit unless the user explicitly invoked this skill for the artifact. Do this editing before returning or saving the final draft.

## 2. Restore the missing context

Find the smallest premise that makes the idea understandable. State it in one or two sentences that do not depend on the previous explanation. Explain the idea in everyday language before naming its technical term. Match the reader's demonstrated expertise. Briefly define unfamiliar terms and use a concrete example when it removes confusion.

Use established terminology from the applicable `CONTEXT.md`. If there are several contexts, select the area through `CONTEXT-MAP.md`. This step is done when the reader can understand or act without reconstructing the earlier explanation and no important nuance is lost.

## 3. Decide whether support helps

First name the reader's task, objects, and needed information. Is the reader looking up a value, comparing cases, inspecting a change, following an event, locating a relationship, detecting a pattern, or operating an interface? State which search or inference another representation would simplify. If none improves, use prose. Several steps or components do not by themselves justify a diagram.

Match the representation to the task:

- Use numbered actions for order and bullets when order does not matter. Each action needs enough context to stand alone.
- Use concise prose, a list, or a table for exact values, commands, or stable comparisons.
- Use a focused diff, before/after values, or a concrete trace for change.
- Use a trace or timeline for chronology, causality, or state transitions.
- Use a shallow tree for hierarchy, ownership, or callers.
- Use a relational diagram for topology, branches, feedback, boundaries, or handoffs.
- Use a plot, map, or interactive view for patterns, clusters, gaps, outliers, or spatial context.
- Use the actual interface or realistic interactive UI for an operator workflow.
- Use short pseudocode or focused code for an algorithm or rule.
- Use the actual screenshot or recording from the owning proof workflow for a real visual result.

Use one worked example when explaining how input produces output. Use a flow when order, branches, or handoffs are what must be inspected. Before drawing, flatten the proposed nodes into a list. Keep the list if it preserves every needed relationship. A diagram must gain meaning from position, grouping, connection, scale, or interaction. Decorative boxes and arrows fail this test.

If two materially different representations both fit and could change understanding, render exactly two from the same facts. Change one meaningful choice. Keep labels, values, and scope consistent. Show them side by side if legible, otherwise stack them. Compare spatial payoff, destination fit, and reading effort; keep the winner unless the reader is choosing. Skip this comparison for cosmetic differences or an obvious choice.

Check the output environment. If native in-conversation visualization or UI is available, load its guidance and prefer native inline output when interaction, filtering, progressive disclosure, spatial context, or an operator view materially helps. In a CLI with a browser or preview, create and open the proper visual and leave a short terminal pointer. In a text-only terminal, use prose, tables, diffs, traces, trees, or established/simple ASCII only when meaning survives. State the limitation and give the facts if important interaction or spatial meaning cannot survive. Use native Markdown tables for compact records and Mermaid when a relational diagram needs a renderer. Do not imitate app chrome with boxes, panels, badges, or buttons. Do not create a separate artifact just for polish.

Build from recognizable objects and concrete inputs, values, states, differences, and outputs. Label illustrative placeholders and never invent proof. Before a diagram, define its one claim, reader, destination size/medium, current or target state, mandatory facts, and details that can stay in prose. Default to one diagram.

Trace the actual actors, subsystems, inputs, stores, decisions, state changes, outputs, authority boundaries, and feedback. Each main step should be one actor performing one concrete action or decision. Group by real owner or phase. Choose topology before styling. Place inputs at entry boundaries, outputs beside their producer, and decisions, stores, reviews, feedback, and outcomes at their actual handoffs. Equal nodes must have equal roles. Make the start and focal relationship easy to find. Every row, axis, connector, position, and interaction must carry needed information.

Use Mermaid DSL as the canonical relational-diagram source. Render it natively on rich outputs and with `mermaid-ascii` for fixed-width graph/sequence output. Use generated output, not a hand-spaced copy. If Mermaid cannot express the relationship, choose another format and say why. Verify destination layout or render the same source with native UI.

Inspect the current render at destination size, not only its source. Check the reader question, clear nouns, focal relationship, branch termination or rejoining, feedback direction, and absence of clipping, collisions, or required zoom. Redesign or remove detail instead of shrinking text. A diagram can explain behavior; only an actual render, interaction, request/response, state, or operator result proves it ran. Remove support if the answer is equally understandable without it. Finish with useful support that repeats no prose and preserves evidence.

## 4. Write naturally

Lead with what happened, what it means, and the next action. Restore necessary context. Name the actor, action, evidence, and tradeoff. Explain technical ideas plainly before naming them. Use a focused example only when it removes ambiguity.

Cut throat-clearing, repetition, filler, vague claims, stacked hedges, synonym cycling, and generic conclusions. Prefer plain words, active verbs, short literal sentences, and paragraph breaks. Use lists or headings when they make a multifaceted answer easier to read, not as decoration.

For a user reply, be specific, give an evidence-backed opinion where useful, use “I” naturally, and vary rhythm. For a reviewer-facing artifact, stay specific and candid without chatty asides. Keep only useful bold and sentence-case headings. Remove decorative emojis, em dashes, and curly quotes from your own prose. Preserve exact quoted text and evidence. This step is done when outcome, reasoning, evidence, and action are understandable without missing context.

## 5. Apply the full catalogue only on the explicit route

List matches internally, rewrite each, restore destination-appropriate voice, and check for remaining machine-like wording. Return the edited draft, not the scan.

Protect literal meanings and owner-given names. Do not rename attack surface/vector, test or agent harness, cryptographic primitive, vector index, `Primitive Obsession`, WCAG `Target Size (Enhanced)`, Cargo `[features]`, or other named concepts. Keep different things such as `Job`, `Task`, and `Run` distinct. Mark reproduced source wording as quotation when needed and preserve its characters exactly. Keep bug-significant punctuation and exact lookup headings. Check references before changing a heading. Never rename an identifier, config key, or API under a prose rule.

1. Replace puffery such as “pivotal moment,” “testament to,” and “evolving landscape” with events.
2. Replace publication name lists with a specific source and what it said.
3. Delete superficial “highlighting/ensuring/reflecting/showcasing/fostering” phrases or make a concrete, supported claim.
4. Replace promotional “vibrant/groundbreaking/renowned/stunning/must-visit” wording with neutral description.
5. Name vague sources such as “experts,” or remove the attribution.
6. Replace “despite challenges, continues to thrive” formulas with facts.
7. Remove padding such as additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, abstract landscape/tapestry, pivotal, showcase, testament, underscore, and vibrant.
8. Prefer “is” or “has” to “serves as,” “stands as,” “boasts,” or “features.”
9. State the point without “not just X, but Y.”
10. Use the actual number of ideas, not an imposed group of three.
11. Use one name consistently for one actor.
12. Replace a “from X to Y” range with a list if the topics share no scale.
13. Use a period or comma instead of an em dash. Do not swap in parentheses, en dashes, or a dash-like hyphen.
14. Use colons for lists, examples, or labels. Split sentences joined by a decorative colon.
15. Bold only key information a skimmer needs, including literal controls when useful.
16. Remove bold label/colon bullets that repeat the label. A named lead-in with a period may introduce new detail.
17. Use sentence-case headings except exact lookup contracts.
18. Remove decorative heading and bullet emojis.
19. Use straight quotes in your own prose.
20. Cut chatbot phrases such as “Certainly,” “I hope this helps,” “Let me know,” and “Found the smoking gun.”
21. Find a source instead of a cutoff disclaimer, or cut the unsupported sentence.
22. Remove “Great question” and “You're absolutely right”; answer directly.
23. Shorten filler: “in order to”→“to,” “due to the fact that”→“because”; delete “it is important to note.”
24. Replace stacked hedges with precise uncertainty such as “may.”
25. Replace generic endings with the actual fact or plan.
26. Replace vague metaphors with concrete words: substrate→base, wedge→add, vague vector→way, design primitive→building block, metaphorical harness→the thing running work, surface→API/screen/diff, scaffolding→setup code, gold-plating→more than needed, ratchet→mechanism/tightening limit, evacuate→move out, endgame→last phase. Also clarify locus, vantage, nexus, bedrock, modality, paradigm, north star, and flywheel. Keep literal senses, financial leverage, and named design properties.
27. State what a mechanism does, not how it feels. Use an instruction, fact, or measured number. Remove interchangeable project claims; keep deliberately portable instructions.
28. Split sentences that require backtracking into understandable ideas.
29. Name the actor and use active voice. Passive is fine when the actor is unknown or irrelevant.
30. Replace weak verbs/adverbs with a stronger verb or measured delta. Never invent a number. State direction with the measurement limitation, or cut the claim.
31. Prefer use/help/many/if over padded utilize/leverage/facilitate/numerous/in the event that.

Every destination needs specificity, varied rhythm, and candid complexity. Replies spoken to the user, including consult questions and discussion of review work, can also have opinions, natural first person, and less rigid structure. Reviewer-facing PR text, captions, commits, verification steps, finding cards, and saved reports use the first three qualities without chatty additions. Split the reply from the saved artifact when audiences differ. Finish with no unprotected catalogue matches, no changed facts, and a recognizable voice.

## 6. Make the final brevity pass

Use the shortest complete answer. Chat ceilings: 100 words for a direct answer, decision, or status; 200 for an ordinary update or focused explanation; 400 for genuinely complex, multipart, or high-risk material. Exceed only for requested depth/format or necessary evidence, safety, compatibility, or actions. Do not pad. Preserve required saved/reviewer artifact structure instead of applying chat ceilings.

Keep each sentence only if it gives outcome, necessary context, evidence, material uncertainty/tradeoff, or an action. Cut unhelpful process narration, repeated conclusions, excess headings/lists, filler, stacked hedges, generic endings, and offers of more work. Prefer prose for one or two points and lists when scanning improves. Remove examples that repeat a clear point.

Read once more for accuracy and usefulness. Keep the premise, proof, safety/compatibility warnings, and requested detail. Run no rewriting pass afterward. Return the draft alone, or to the calling skill. Done means further cutting would remove useful meaning.

Adapted from Matt Pocock `wait-what`, HumanLayer `show-me`, and pstack `unslop`. Preserve [upstream licenses](references/upstream-licenses.md) as provenance, not an extra writing step.
