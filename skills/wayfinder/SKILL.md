---
name: wayfinder
description: 'Plan a huge chunk of work, more than one agent session can hold, as a shared Obsidian issue map, and resolve tickets one at a time until the way to the destination is clear.'
---

# Wayfinder

A loose idea has arrived, too big for one agent session and wrapped in fog: the
way from here to the destination is not visible yet. Wayfinding is about finding
that way, not charging at the destination. This skill charts the way as a shared
map in Obsidian, then works its tickets one at a time until the route is clear.

The destination varies per effort, and naming it is the first act of charting:
it shapes every ticket. It might be a spec to hand off and iterate on, a
decision to lock before planning starts, or a change made in place like a data
structure migration. The map is domain-agnostic.

## Plan, don't do

Wayfinder is planning by default. Each ticket resolves a decision, and the map
is done when the way is clear: nothing is left to decide before someone builds
the thing. An effort can override this in its Notes, carrying execution into the
map itself, but absent that, produce decisions, not deliverables.

## The Map

The map is a single Obsidian issue note. Its tickets are child Obsidian issue
notes linked from the map and from their blockers.

The map is an index, not a store. It lists decisions made and points at the
tickets that hold their detail. A decision lives in exactly one place: its
ticket. The map never restates it, only gists it and links.

Use Obsidian `Issues/` unless the vault already has a better convention.

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
- [[<closed ticket title>]] - <one-line gist>

## Not Yet Specified
<in-scope fog that cannot be ticketed yet>

## Out Of Scope
<work ruled beyond this destination>
```

### Tickets

Each ticket is an Obsidian issue note. Its body is the question, sized to one
agent session:

```markdown
# Ticket: <question>

Status: Open
Type: Ticket
Wayfinder: [[<map>]]
Mode: AFK | HITL
Kind: research | prototype | grilling | task
Blocked By: [[<ticket>]] | None

## Question
<the decision or investigation this ticket resolves>
```

Blocking edges define the frontier. A ticket is unblocked when every ticket in
`Blocked By` is closed. The frontier is the open, unblocked tickets.

## Ticket Types

Every ticket is either HITL, worked with a human who speaks for themselves, or
AFK, driven by the agent alone. A HITL ticket only resolves through that live
exchange; the agent never stands in for the human's side of it.

- **Research** (AFK): reading docs, third-party APIs, source code, specs, or
  knowledge bases. Creates a Markdown summary as a linked asset.
- **Prototype** (HITL): a cheap concrete artifact to react to, such as an
  outline, rough take, UI stub, or logic sketch. Link the prototype as an asset.
- **Grilling** (HITL): conversation via `grilling`, one question at a time. This
  is the default case.
- **Task** (HITL or AFK): manual work that must happen before a decision can be
  made, such as provisioning access or moving data. It earns its place by
  unblocking a decision, not by delivering the destination.

## Fog Of War

The map is deliberately incomplete: do not chart what you cannot yet see.
Beyond the live tickets is fog: decisions and investigations you can tell are
coming but cannot yet pin down because they hang on open questions. Resolving a
ticket clears the fog ahead of it, graduating whatever is now specifiable into
fresh tickets until the way to the destination is clear.

Fog or ticket? The test is whether you can state the question precisely now, not
whether you can answer it now.

- Ticket when the question is already sharp, even if it is blocked.
- Not Yet Specified when you cannot yet phrase it that sharply.

Out of scope is different from fog. Fog gathers toward the destination. Work
beyond the destination belongs in Out Of Scope and never graduates unless the
destination changes.

## Invocation

Two modes. Either way, never resolve more than one ticket per session.

### Chart the map

1. Name the destination. Run `grilling` to pin down what this map is finding the
   way to: a spec, decision, or change.
2. Map the frontier. Grill breadth-first, fanning out across the space rather
   than going deep on one thread. If this surfaces no fog, the journey is small
   enough for one session; stop and ask how the user wants to proceed.
3. Create the map with Destination, Notes, empty Decisions So Far, and the fog
   sketched into Not Yet Specified.
4. Create the tickets you can specify now, then wire blocking edges in a second
   pass. Everything you cannot yet specify stays in Not Yet Specified.
5. Stop. Charting the map is one session's work; do not also resolve tickets.

### Work through the map

1. Load the map at low resolution, not every ticket body.
2. Choose the ticket. If the user named one, use it. Otherwise take the first
   frontier ticket in order.
3. Resolve it. Zoom as needed: fetch related or closed tickets on demand, and
   invoke the skills named in Notes.
4. Record the resolution in the ticket, close it, and append a context pointer
   to Decisions So Far on the map.
5. Add newly surfaced tickets and graduate fog that has become specifiable. If
   the answer reveals a ticket is beyond the destination, rule it out of scope
   rather than resolving it on the route.
