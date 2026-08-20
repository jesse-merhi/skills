---
name: research
description: 'Research primary sources for docs, APIs, standards, source behavior, or implementation context.'
---

# Research

Investigate a question against primary sources. Write a cited Markdown note
only when the user asks for durable research; otherwise return the cited answer
in chat without creating an artifact.

Primary sources include official docs, source code, specs, standards, release
notes, first-party APIs, and repository-owned notes. Prefer them over blog
posts, summaries, forum answers, or search snippets.

## Workflow

1. Restate the research question and the decision or task it should support.
2. Identify where this repo keeps research notes. If there is no convention,
   use a sensible local path and report it before writing when the location is
   ambiguous.
3. Gather evidence from primary sources. For library, framework, SDK, API, CLI,
   or cloud-service docs, use current official documentation.
4. Write one Markdown note with:
   - the question;
   - short answer;
   - cited findings with links or source paths;
   - uncertainty, version limits, or stale-risk notes;
   - recommended next step.
5. Return the note path and the key conclusion. Do not keep important findings
   only in chat.

## Output shape

```md
# Research: <question>

## Short Answer
<answer>

## Findings
- <claim> Source: <URL or file path>

## Caveats
- <version, date, uncertainty, or open question>

## Next Step
- <how this should feed grilling, planning, implementation, or review>
```
