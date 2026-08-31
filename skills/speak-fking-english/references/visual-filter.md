# Visual filter

Treat this as a visual filter, not a request to draw something. Add support only
when it materially reduces the work needed to understand or use the answer.

1. Name the reader's task and the information structure.

   State what the reader needs to do: find an exact value, compare cases,
   inspect a change, follow an event, locate a relationship, detect a pattern,
   or operate an interface. Name the data or objects involved. Do this before
   choosing prose, a table, ASCII, a diagram, or UI.

   Ask what search or inference another representation would make easier. A
   topic, heading, or set of steps is not enough. If there is no concrete gain,
   choose prose.

2. Match the representation to that task.

   - Linear steps or stages: a numbered list when order matters; bullets when
     it does not. Make each item a concrete action with enough context to stand
     on its own.
   - Exact lookup, precise values, commands, or stable comparison: concise
     prose, a list, or a table.
   - Change or transformation: a focused diff, before-and-after values, or a
     trace through one concrete case.
   - Chronology, causality, or state transitions: an event trace or timeline.
   - Hierarchy, ownership, or caller relationships: a shallow tree.
   - Topology, branching, feedback, boundaries, or handoffs: a small relational
     diagram.
   - Patterns, clusters, gaps, outliers, or spatial context: a plot, map, or
     interactive view.
   - An operator workflow: the actual interface or a realistic interactive UI.
   - An algorithm or rule: short pseudocode or the focused code itself.
   - A real visual result: the actual screenshot or recording from the owning
     proof workflow.

   Use a worked example when the question is how a mechanism turns a concrete
   input into an outcome. Use a flow only when order, branching, or handoffs are
   what the reader must inspect. Several steps, files, or components do not
   automatically justify a visual.

   Apply the spatial-payoff test: say which search or inference becomes easier
   because of position, grouping, connection, scale, or interaction. If layout
   carries no information, it is decoration rather than a visual explanation.

   Apply the list test before choosing any diagram. Rewrite its nodes as prose
   or a list. If that preserves all meaning, use the prose or list. Boxes,
   lanes, or arrows that only restate the list do not count as spatial payoff.
   Use a diagram only when flattening it would hide a relationship the reader
   needs, such as branching, parallel work, feedback, boundary crossing,
   ownership, timing, scale, or topology.

3. A/B when the representation choice is genuinely ambiguous.

   If two materially different representations both fit the task and the
   choice could change what the reader understands, render exactly two
   candidates from the same facts. Change one meaningful decision between A
   and B, such as sequence versus topology or left-to-right versus top-down.
   Keep their labels, values, and scope otherwise consistent.

   Show A and B side by side when the destination keeps both legible; stack
   them when it does not. Compare them on the spatial-payoff test, destination
   fit, and reading effort. Keep the winner unless the reader is making the
   choice. Skip A/B for cosmetic variations or when one representation already
   matches the task clearly.

4. Preserve the representation across the available output surface.

   Inspect the environment's output capabilities before composing the support.

   - When the environment provides a native in-conversation visualization or
     UI capability, load and follow it. Prefer the native inline result when
     interaction, filtering, progressive disclosure, spatial context, or a
     realistic operator view materially improves the explanation.
   - From a CLI with a browser, file preview, or other viewable-artifact
     capability, create and open the proper visual there. Keep the terminal
     response to the result and a short pointer. Do not flatten a genuinely
     visual or interactive task into ASCII merely because the conversation
     started in a terminal.
   - In a text-only terminal, use prose, tables, diffs, traces, or trees only
     when the meaning survives as text. Use ASCII for an established textual
     convention or a simple relationship whose layout remains legible. If the
     important interaction or spatial meaning cannot survive, state the
     limitation and give the underlying facts instead of counterfeiting a UI.
   - In Markdown, use native tables for compact records and Mermaid only when a
     relational diagram needs its renderer.

   Terminal text is a representation with strengths, not a generic fallback.
   Do not imitate application chrome with decorative boxes, panels, badges, or
   button-like labels. Do not create a standalone artifact whose only job is
   polish.

5. Build and check the support.

   Start with the object the reader recognizes. Show concrete inputs, values,
   states, differences, and outputs. If real values are unavailable, use
   obvious placeholders labelled as illustrative; do not invent evidence.

   If a diagram survives the list test, define its contract before drawing:
   one claim, the named reader, destination size and medium, current or target
   state, facts that must appear, and details that can remain prose. Default to
   one diagram.

   Trace the real actors, subsystems, inputs, stores, decisions, state changes,
   outputs, authority boundaries, and feedback. Make each primary step one
   actor performing one concrete action or decision. Group related steps by
   their real owner or phase.

   Choose topology before styling or polishing labels. Put inputs beside the
   boundary they enter, outputs beside their producer, and decisions, stores,
   review, feedback, and outcomes at their real handoff points.
   Equal nodes imply equal roles; use them only when that is true.
   The start, focal relationship, decisions, feedback, and outcome should be
   easy to locate.

   Keep it compact. Every row, axis, connector, position, and interaction must
   carry meaning the reader needs. Use familiar conventions and make the
   inspection path obvious. Render or inspect the result on its destination
   surface; source code is not visual validation.

   For relational diagrams, use Mermaid DSL as the canonical source. Render it
   with the destination's Mermaid support on rich outputs and with
   `mermaid-ascii` for graph or sequence layouts in a fixed-width terminal.
   Treat the generated output as the source of truth rather than hand-spacing
   an equivalent. If Mermaid cannot express the required relationship, choose
   another format and state why. Verify that the destination preserves the
   layout; otherwise render the same source with native UI.

   Inspect the current render, not only its source. At the destination size,
   confirm that it answers one reader question, every prominent noun is clear,
   the focal relationship is obvious, branches terminate or rejoin, feedback
   points the right way, and nothing clips, collides, or requires zooming.
   Redesign the topology or remove detail instead of shrinking text until it
   fits. Source validity does not prove that the diagram communicates.

   A visual can explain behavior. Only the actual rendered result, interaction,
   request, response, state, or operator outcome can prove it ran. Remove the
   support once more. Keep it only if the answer becomes harder to understand
   or use without it. Done when the representation fits the reader's task,
   repeats no prose, and leaves real evidence intact.
