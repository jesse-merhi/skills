# Independent Reviewers

Use context-free subagents. Pass the article path or exact content, audience,
purpose, and one lens. Repository inspection is allowed; conversation history
is not.

Use this neutral prompt shape:

```text
Use $blog-review at <skill-path> to review <article-path> through only the
<lens> lens. The article is for <audience> and intends to <purpose>. Inspect the
raw article and report only concrete reader-facing problems that pass the
skill's finding bar. Return candidate findings with location, evidence, impact,
and revision direction. Do not edit the article.
```

For the voice lens, add canonical corpus paths. Do not summarize the corpus for
the reviewer; let it inspect the evidence directly.

For a cold final pass, provide the final article and all four lens names, but no
prior findings, rejected alternatives, revision history, or expected clean
verdict.

If an agent returns a broad opinion, ask once for concrete evidence and reader
impact. The coordinator still owns confirmation and rejection.
