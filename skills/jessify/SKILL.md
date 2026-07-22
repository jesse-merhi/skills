---
name: jessify
description: 'Rewrite or regenerate blog prose in Jesse Merhi’s personal voice while preserving meaning. Use for Jesse-style blog drafting, voice transfer, corpus ingestion, preference capture, reverse-instruction dataset preparation, or evaluating whether prose sounds like Jesse.'
---

# Jessify

Treat Jessification as authorship transfer, not copy-editing. Preserve the
facts, opinions, uncertainty, and narrative order while replacing the source's
surface prose.

## Workflow

1. Resolve `<skill-dir>` to this skill's directory and choose a local Jessify
   workspace. Default to `~/.local/share/jessify`; never commit the corpus or
   generated training data unless the user explicitly asks.

2. Prepare the corpus when new writing arrives.

   Read [references/corpus.md](references/corpus.md), then run:

   ```sh
   <skill-dir>/scripts/jessify-data init --workspace <workspace>
   <skill-dir>/scripts/jessify-data ingest --workspace <workspace> \
     --input <file-or-directory> --quality <canonical|usable|exclude>
   <skill-dir>/scripts/jessify-data stats --workspace <workspace>
   ```

   Use `canonical` only for writing Jesse still endorses. Keep AI-heavy,
   uncertain, or merely topical text out of the canonical corpus.

3. Convert finished writing into training pairs.

   Read [references/reverse-instructions.md](references/reverse-instructions.md).
   Generate reverse-instruction responses for the request file produced by:

   ```sh
   <skill-dir>/scripts/jessify-data requests --workspace <workspace>
   ```

   Either submit that JSONL through a model's batch API, or use any local CLI
   that accepts a prompt on stdin and prints the requested JSON on stdout:

   ```sh
   <skill-dir>/scripts/jessify-data run-requests --workspace <workspace> \
     --command '<model-runner>' --resume
   ```

   Merge the responses and export model-neutral SFT data:

   ```sh
   <skill-dir>/scripts/jessify-data merge-responses --workspace <workspace> \
     --responses <responses.jsonl>
   <skill-dir>/scripts/jessify-data export-sft --workspace <workspace>
   ```

   Done when `validate` passes and evaluation documents are absent from the
   training export.

4. Jessify prose.

   - First extract a neutral content brief: claims, facts, story beats,
     uncertainty, technical terms, and required transitions.
   - Discard the source wording. Do not line-edit an AI draft sentence by
     sentence; its cadence will survive the edit.
   - Retrieve three to six examples with the same rhetorical job:

     ```sh
     <skill-dir>/scripts/jessify-data retrieve --workspace <workspace> \
       --query-file <neutral-brief> --role <role> --limit 5
     ```

   - Generate the passage afresh from the neutral brief, local section context,
     and retrieved examples. Use examples as evidence of voice, not phrases to
     copy.
   - Preserve intentional Jesse features when they serve the passage: winding
     spoken clauses, ellipses, direct questions, self-aware asides, emphatic
     capitalization, concrete examples, and occasional short punchlines.
   - Prefer specific narrative turns over generic drama. Preserve grammatical
     imperfections only when they are clearly intentional voice rather than an
     accident.

5. Review independently.

   Invoke `blog-review` after a section or full article has been Jessified. The
   writer must not be the only judge of its own output. Pass the target and the
   canonical corpus location, but do not tell reviewers which lines were
   difficult or what verdict to reach.

6. Record user feedback.

   When Jesse rejects one version and approves another, record the source,
   rejected output, accepted output, reason, and rhetorical role:

   ```sh
   <skill-dir>/scripts/jessify-data record-preference --workspace <workspace> \
     --source-file <source> --rejected-file <rejected> \
     --accepted-file <accepted> --reason <reason> --role <role>
   ```

   Export these as DPO-style preference data only after validation:

   ```sh
   <skill-dir>/scripts/jessify-data export-dpo --workspace <workspace>
   ```

7. Train only behind an evaluation gate.

   Read [references/training-and-evaluation.md](references/training-and-evaluation.md).
   Prepare neutral briefs for held-out documents with `requests --split eval`
   and `merge-responses --split eval`. Benchmark retrieval-only generation, a
   parameter-efficient adapter, and any experimental style-steering method on
   those same cases. Use `build-blind-eval` and `score-blind-eval` to choose the
   system Jesse prefers without system labels while content-preservation checks
   still pass.

## Done Means

- Every generated passage preserves the neutral brief.
- Canonical examples match the passage's rhetorical role.
- A separate blog review found no unresolved material issue, or remaining
  findings are shown explicitly.
- User approvals and rejections are captured for future preference training.
- Corpus, training, and evaluation artifacts pass `jessify-data validate`.

## Avoid

- treating readability, sentence length, or an LLM-authorship score as the
  objective;
- retrieving examples only because they share topic words;
- training on the article used for evaluation;
- silently adding AI-edited prose to the canonical corpus;
- copying distinctive phrases from a reference when an original expression is
  possible;
- claiming that text sounds like Jesse without either corpus evidence or
  Jesse's approval.
