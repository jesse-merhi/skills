---
name: blog-review
description: 'Orchestrate independent editorial review of a blog post or long-form article. Use when the user asks agents to critique writing, review storytelling or prose, find voice and flow problems, or run a review-and-revise loop until the article has no confirmed actionable writing findings.'
---

# Blog Review

Review writing like a serious code change: freeze the target, inspect it through
independent lenses, confirm findings personally, deduplicate root causes, and
record the entire run outside chat memory.

## Workflow

1. Resolve `<skill-dir>` to this skill's directory. Select a local findings
   database, normally `<jessify-workspace>/reviews/blog-reviews.sqlite`.

2. Freeze the target.

   Record the absolute path, content hash, review mode (`review-only` or
   `review-and-revise`), intended audience, article purpose, and canonical
   voice-corpus path. Initialize the registry:

   ```sh
   <skill-dir>/scripts/blog-findings init --db <db> --review-id <id> \
     --target <article> --mode <mode> --audience <audience> \
     --purpose <purpose> --corpus-path <canonical-corpus>
   ```

   The registry hashes the target itself. If `--target-hash` is supplied, it
   verifies the value rather than trusting it.

3. Dispatch independent reviewers.

   Read [references/subagents.md](references/subagents.md) and
   [references/lenses.md](references/lenses.md). Use fresh, context-free agents
   in parallel for these lenses:

   - story and structure;
   - paragraph and sentence flow;
   - voice and authenticity;
   - reader comprehension and factual continuity.

   Give each reviewer the raw article, its single lens, the audience and
   purpose, and only the corpus evidence required by that lens. Do not reveal
   implementation history, prior complaints, other findings, or the desired
   verdict.

4. Confirm findings personally.

   Read the whole target after the reviewers return. Apply the finding bar in
   [references/findings.md](references/findings.md): verify quoted evidence,
   reproduce the reader problem in context, merge observations with the same
   root cause, and reject taste-only alternatives. Record accepted, rejected,
   and duplicate observations immediately with `blog-findings record`.

5. Report or revise.

   - In `review-only` mode, return the confirmed registry ordered by reader
     impact. Do not edit the article.
   - In `review-and-revise` mode, invoke `jessify` to address confirmed
     findings in the real target. Preserve unaffected prose. Record each fixed
     finding, then run a fresh context-free holistic reviewer on the new target.
   - Stay in the review-and-revise loop until a fresh final pass has no
     confirmed actionable findings. Do not call subjective alternatives
     findings merely to keep the loop alive.

6. Close out from the registry.

   ```sh
   <skill-dir>/scripts/blog-findings closeout --db <db> --review-id <id>
   ```

   Use that output for the final report. Include the review ID, target hash,
   agents and lenses used, findings by status, changes made, remaining human
   judgment, and the query command.

## Review State

Record each reviewer pass:

```sh
<skill-dir>/scripts/blog-findings record-pass --db <db> --review-id <id> \
  --agent <agent> --lens <lens> --target-hash <sha256> \
  --verdict <findings|clean|blocked> --notes <summary>
```

Record each observation:

```sh
<skill-dir>/scripts/blog-findings record --db <db> --review-id <id> \
  --finding-id W<N> --lens <lens> --severity <P1|P2|P3> \
  --status <open|fixed|rejected|deferred|duplicate> \
  --location <section-or-line> --summary <problem> --evidence <evidence> \
  --suggestion <revision-direction> --fingerprint <root-cause>
```

## Done Means

- Every required lens ran in an independent agent.
- The coordinator personally checked every reported finding against the target.
- Findings are concrete, root-cause-deduplicated, and stored in SQLite.
- Review-only output reflects the complete registry.
- Review-and-revise output has a fresh clean holistic pass on the final content
  hash, or explicitly reports why it stopped.

## Stop Honestly

Stop without claiming clean when agents are unavailable, the target changes
outside the review loop, factual verification requires unavailable sources,
the consultation queue reaches five unresolved questions, or the user stops the
run.

## Avoid

- one model writing and approving the same passage;
- leaking earlier criticism into a supposedly independent reviewer;
- reporting grammar quirks that are intentional voice;
- equating readability scores or AI detectors with writing quality;
- fixing broad taste preferences without a demonstrated reader problem;
- returning only the last clean pass and hiding issues fixed earlier.
