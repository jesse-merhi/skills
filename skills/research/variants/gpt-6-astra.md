---
name: research
description: 'Investigate technical or product questions against primary sources, preserve substantive discoveries in the project Obsidian notes, and return cited conclusions.'
---

# Research

Outcome: return a cited conclusion grounded in the primary sources that own the
claim, and preserve substantive discoveries in the project notes. Do the work
in the current session; a research request does not authorize a subagent.

Use this when the answer depends on documentation, source code, standards,
first-party APIs, release behavior, or evidence outside the conversation.

## Evidence

Choose sources and search terms from the question and project context,
preferring the primary source that owns each claim: official documentation,
specifications, repository source, release notes, first-party APIs, and
project-owned notes.
Use secondary material only to find a primary source or to present a clearly
labelled outside interpretation.

Record versions and dates when behavior can change. Separate sourced facts,
inferences, and unresolved questions.

## Obsidian notes

Preserve substantive discoveries in the user's Obsidian-backed project notes
so a later session can recover the evidence. Update one topic or task note
rather than creating a file for every lookup.

A useful note contains:

- the question and the decision it supports;
- the short answer;
- cited findings with URLs or source paths;
- version, date, uncertainty, and stale-risk notes;
- the effect on the current plan or implementation;
- open questions worth carrying forward.

Follow the vault's existing project folder and naming convention. When an
Obsidian connector or known vault is unavailable, keep the findings in chat and
report that they were not persisted. Do not fall back to a repository Markdown
file or an arbitrary local note. Never store credentials, raw environment
files, personal data, or large copied source passages.

## Return

Lead with the conclusion, cite the evidence near each claim, and link or name
the Obsidian note when one was updated. A later handoff should include that note
as durable context.

This skill is a repository-owned fork of Matt Pocock's MIT-licensed `research`
workflow. The local fork performs research in the current session and stores
durable findings in Obsidian instead of spawning a background agent or writing
notes into the repository.
