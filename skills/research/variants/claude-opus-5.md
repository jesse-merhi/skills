---
name: research
description: 'Investigate technical or product questions against primary sources, preserve substantive discoveries in the project Obsidian notes, and return cited conclusions.'
---

# Research

Answer the scoped research question from the primary sources that own each
claim, and keep all research in the current session. Open with the question and
source boundary in one short line. Update only when a source materially changes
the conclusion, evidence conflicts, or access blocks the requested answer.

Lead the final response with the conclusion, cite claims near their evidence,
and keep caveats to those that affect the decision. Preserve only substantive
discoveries in the project's Obsidian notes, using the existing structure
without filler. Verify version-sensitive claims against current primary sources;
do not add a generic recheck. A research request never authorizes a subagent.

Research questions whose answer depends on documentation, source code,
standards, first-party APIs, release behavior, or other evidence outside the
current conversation. Do the work in the current session. A research request
does not create a subagent.

## Evidence

Prefer the source that owns the claim: official documentation, specifications,
repository source, release notes, first-party APIs, and project-owned notes.
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
