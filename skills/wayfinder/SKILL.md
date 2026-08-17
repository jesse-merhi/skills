---
name: wayfinder
description: 'Map multi-session work as Obsidian decision tickets and resolve them until the route is clear.'
---

# Wayfinder

A loose idea has arrived, too big for one agent session and wrapped in fog: the
way from here to the destination is not visible yet. Wayfinding is about finding
that way, not charging at the destination. This skill charts the way as a shared
map in Obsidian, then works its decision tickets: questions whose resolution is
a decision, not slices of a build to execute. Resolve them one at a time until
the route is clear.

The destination varies per effort, and naming it is the first act of charting:
it shapes every ticket. It might be a spec to hand off and iterate on, a
decision to lock before planning starts, or a change made in place like a data
structure migration. The map is domain-agnostic.

## Plan, don't do

Wayfinder is planning by default. Each ticket resolves a decision, and the map
is done when the way is clear: nothing is left to decide before someone builds
the thing. Treat the pull to start building as a signal that you have reached
the edge of the planning map and should hand off. An effort can override this in
its Notes, carrying execution into the map itself, but absent that, produce
decisions, not deliverables.

## Refer by name

Refer to every map and ticket by its readable note title in narration and in the
map's Decisions So Far. Wrap the title in an Obsidian wikilink. When the stored
file path or slug differs from that title, use an alias such as
`[[<ticket note>|<ticket title>]]` so the link stays valid and readable.

## The Map

The map is a single Obsidian issue note: the canonical artifact. Its tickets are
child Obsidian issue notes. Each ticket links back through its `Wayfinder` field
and to its blockers through `Blocked By`.

The map is an index, not a store. It lists decisions made and points at the
tickets that hold their detail. A decision lives in exactly one place: its
ticket. The map never restates it, only gists it and links.

Use Obsidian `Issues/` unless the vault already has a better convention.

Load the map once at low resolution each session. Do not list open tickets in
its body; discover them through Obsidian backlinks or a vault search for the
map's `Wayfinder` wikilink.

### Map body

```markdown
# Wayfinder: <destination name>

Status: Active
Type: Wayfinder Map

## Destination
<what reaching the end of this map looks like>

## Notes
<domain, skills every session should consult, standing preferences>

## Decisions So Far
- [[<closed ticket note>|<closed ticket title>]] - <one-line gist>

## Not Yet Specified
<in-scope fog that cannot be ticketed yet>

## Out Of Scope
<work ruled beyond this destination>
```

### Tickets

Each ticket is an Obsidian issue note. Give its heading a readable question,
retain the vault's file-naming convention, and size the question to one
100K-token agent session:

```markdown
# Ticket: <question>

Status: Open
Type: Ticket
Wayfinder: [[<map note>|<map title>]]
Mode: AFK | HITL
Kind: research | prototype | grilling | task
Claimed By: <person or agent session> | None
Blocked By: [[<ticket note>|<ticket title>]] | None

## Question
<the decision or investigation this ticket resolves>
```

Claim a ticket before doing any work: replace `None` in `Claimed By`, save the
note, then reread it. Continue only if your claim remains. Concurrent sessions
skip claimed tickets.

Blocking edges define the frontier. A ticket is unblocked when every ticket in
`Blocked By` is closed. The frontier is the open, unblocked, unclaimed child
tickets.

Do not add an answer when creating a ticket. On resolution, append a
`## Resolution` section containing the answer and links to any assets, then
close the ticket. The decision lives in that section; Decisions So Far only
gists and links it.

## Ticket Types

Every ticket is either HITL, worked with a human who speaks for themselves, or
AFK, driven by the agent alone. A HITL ticket only resolves through that live
exchange; the agent never stands in for the human's side of it.

- **Research** (AFK): invoke `research` to read primary sources such as docs,
  third-party APIs, source code, specs, or knowledge bases. Create a Markdown
  summary as a linked asset.
- **Prototype** (HITL): make a cheap concrete artifact to react to, such as an
  outline, rough take, UI stub, or logic sketch. Link it as an asset. Invoke the
  local `prototype` skill only for UI exploration the user explicitly requested.
- **Grilling** (HITL): conversation via `grilling`, working the settled
  frontier in numbered rounds. This is the default case.
- **Task** (HITL or AFK): manual work that must happen before a decision can be
  made, such as provisioning access or moving data. It is the one type that
  does rather than decides, and earns its place by unblocking a decision, not by
  delivering the destination. Record what happened and any facts later tickets
  need when resolving it.

## Fog Of War

The map is deliberately incomplete: do not chart what you cannot yet see.
Beyond the live tickets is fog: decisions and investigations you can tell are
coming but cannot yet pin down because they hang on open questions. Write that
dim view in Not Yet Specified. Resolving a ticket clears the fog ahead of it,
graduating whatever is now specifiable into fresh tickets until the way to the
destination is clear and no open tickets remain.

Fog or ticket? The test is whether you can state the question precisely now, not
whether you can answer it now.

- Ticket when the question is already sharp, even if it is blocked.
- Not Yet Specified when you cannot yet phrase it that sharply. Do not pre-slice
  fog into guessed ticket-sized pieces; one patch may graduate into several
  tickets or none.

Not Yet Specified excludes closed decisions, live tickets, and work already
ruled out of scope.

## Out of scope

Fog gathers toward the destination. Work beyond the destination belongs in Out
Of Scope and never graduates unless the destination changes. If an existing
ticket turns out to sit beyond the destination, close it and add one linked line
to Out Of Scope with the reason. Do not add it to Decisions So Far: setting a
scope boundary is not a decision on the route.

If the destination changes, treat previously out-of-scope work as a fresh
effort, not a resumed ticket.

## Invocation

Two modes. Either way, never resolve more than one ticket per session. Research
tickets are the exception: independent research tickets may run in parallel.

### Chart the map

1. Name the destination. Run `grilling` to pin down what this map is finding the
   way to: a spec, decision, or change. The destination fixes the scope, so
   settle it first.
2. Map the frontier. Grill breadth-first in frontier rounds, fanning out across
   the space rather than going deep on one thread. If this surfaces no fog, the
   journey is small enough for one session; stop and ask how the user wants to
   proceed.
3. Create the map with Destination, Notes, empty Decisions So Far, and the fog
   sketched into Not Yet Specified.
4. Create the tickets you can specify now as child notes, then wire `Blocked By`
   wikilinks in a second pass. Everything you cannot yet specify stays in Not
   Yet Specified.
5. Dispatch one `research` subagent per research ticket. Have each subagent
   claim its assigned ticket before work, then link the result and resolve the
   ticket. If the harness cannot dispatch subagents, leave the research tickets
   on the frontier and report that limitation.
6. Stop. Charting the map is one session's work; do not hand-resolve a
   non-research ticket too.

### Work through the map

1. Load the map at low resolution, not every ticket body. Discover child tickets
   by their `Wayfinder` wikilink.
2. Choose the ticket by its readable title. If the user named one, use it.
   Otherwise take the first frontier ticket in order. Claim it, save it, and
   verify the claim before continuing.
3. Resolve it. Zoom as needed: fetch related or closed tickets on demand, and
   invoke the skills named in Notes.
4. Reread the current ticket and map before writing. Append the Resolution,
   set `Status: Closed`, and add its linked, one-line context pointer to
   Decisions So Far.
5. Add newly surfaced tickets create-then-wire. Graduate any fog the answer has
   made specifiable, removing each graduated patch from Not Yet Specified so it
   lives only in its ticket.
6. If a ticket sits beyond the destination, rule it out of scope. If the
   decision invalidates another ticket, update its question or blockers, or
   close it as superseded. Preserve concurrent edits while making each change.
