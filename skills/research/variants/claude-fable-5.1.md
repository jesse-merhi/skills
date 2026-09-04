---
name: research
description: 'Investigate technical or product questions against primary sources, preserve substantive discoveries in the project Obsidian notes, and return cited conclusions.'
---

# Research

Complete the requested investigation in this session and return a cited answer.
Do not create a research subagent.

1. Identify the question and the decision it supports. Use the conversation and
   existing project notes to establish scope.
2. Retrieve the sources that own the claims: official documentation, specs,
   repository code, release notes, first-party APIs, or project-owned notes.
   Batch independent lookups. Use secondary material to locate primary evidence
   or clearly identify it as an outside interpretation.
3. Record applicable dates and versions. Quote copied wording as a quotation;
   keep paraphrases and your inferences distinct. Look up current or unfamiliar
   facts rather than filling gaps from memory.
4. Resolve the actual question. During a long investigation, report a changed
   conclusion, useful evidence, or a blocker. Do not narrate every search.
5. Save substantive findings in one Obsidian topic or task note using the vault's
   established conventions. Include the question, answer, sources, version/date,
   uncertainty and stale risk, implementation implications, and open questions.
   Keep credentials, raw environment files, personal data, and long copied
   passages out of that note.
6. Return the conclusion with citations near each claim and the updated note's
   link or name. Carry that note into a later handoff when relevant.

If no connector or known vault is available, give the findings in chat and say
that they were not persisted. Do not create a substitute note in the repo or
another local directory.

This MIT-licensed fork of Matt Pocock's `research` workflow uses current-session
execution and Obsidian storage in place of background research and repo notes.
