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

4. Measure the voice before trying to imitate it.

   Adjectives are not a specification. Build a measured profile once per corpus
   change, then read the card it produces:

   ```sh
   <skill-dir>/scripts/jessify-voice profile --workspace <workspace> --canonical-only
   <skill-dir>/scripts/jessify-voice card --workspace <workspace>
   ```

   The card states Jesse's own range on fifteen dimensions with quoted examples
   of each device. Both edges of every range are wrong. Overshooting the cheap
   casual markers is the common failure: measured against this corpus, model
   output uses five times Jesse's contraction rate and four times his rate of
   opening sentences with "So" or "But", while using almost no first person and
   almost none of his long winding sentences. Writing that sounds "casual" is
   usually an impersonation, not a likeness.

5. Jessify prose.

   Rewrite, score against the profile, and revise until it lands:

   ```sh
   <skill-dir>/scripts/jessify-write --workspace <workspace> --file <input> \
     --candidates 3 --revisions 2
   ```

   It drafts several candidates, keeps the ones that preserve every number,
   scores each against the measured profile, and re-prompts the loser with the
   specific dimensions that were out of range. Pass `--command '<cli>'` to use
   any generator that takes a prompt on stdin; without it the local Ollama model
   is used, which keeps a private corpus on the machine.

   Check the result yourself:

   ```sh
   <skill-dir>/scripts/jessify-voice score --workspace <workspace> --file <draft>
   ```

   Jesse's own held-out passages score about 0.02. Treat anything above 0.05 as
   not yet in his voice, and read the named deviations rather than guessing.

   When writing by hand rather than through the script:

   - Discard the source wording. Do not line-edit an AI draft sentence by
     sentence; its cadence will survive the edit.
   - Preserve intentional Jesse features when they serve the passage: winding
     spoken clauses, ellipses, direct questions, self-aware asides, emphatic
     capitalization, concrete examples, and occasional short punchlines.
   - Prefer specific narrative turns over generic drama. Preserve grammatical
     imperfections only when they are clearly intentional voice rather than an
     accident.

6. Review independently.

   Invoke `blog-review` after a section or full article has been Jessified. The
   writer must not be the only judge of its own output. Pass the target and the
   canonical corpus location, but do not tell reviewers which lines were
   difficult or what verdict to reach.

7. Record user feedback.

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

   For a substantial preference-labeling session, use the loopback-only blind
   desk instead of recording examples one at a time. Read
   [references/training-and-evaluation.md](references/training-and-evaluation.md),
   then prepare and serve a training batch:

   ```sh
   <skill-dir>/scripts/jessify-rlhf prepare --workspace <workspace> \
     --name preferences-001 --purpose preference --model qwen3:4b --limit 30
   <skill-dir>/scripts/jessify-rlhf serve --workspace <workspace> \
     --batch preferences-001
   ```

   The desk asks only one thing: which anonymous passage sounds like Jesse wrote
   it. It never asks him to imagine authoring a passage he has no reason to
   write. `prepare` refuses sources that cannot carry that question — passages
   crowded with names, versions, and timestamps, and passages with no personal
   voice to learn from — and reports a text-free tally of what it skipped.

   Rejections are routed, not filed. "Too specific" and "not really prose" veto
   that passage; "this whole article is not my voice" vetoes the document. Vetoes
   persist in `rlhf/eligibility.jsonl` and are honoured by every later batch:

   ```sh
   <skill-dir>/scripts/jessify-rlhf eligibility --workspace <workspace>
   ```

   Voice and faithfulness are separate answers. Flagging the winning option as
   changing a fact forces an edit before it can be saved, so prose that reads
   right but states something false never becomes a training target.

   The desk hides system identity, autosaves choices locally, supports edited
   winners, and exports DPO pairs only after every case is labeled. Never
   export a held-out evaluation batch into preferences.

8. Evaluate blind when comparing systems.

   Read [references/training-and-evaluation.md](references/training-and-evaluation.md).
   Prepare neutral briefs for held-out documents with `requests --split eval`
   and `merge-responses --split eval`. Benchmark retrieval-only generation, a
   parameter-efficient adapter, and any experimental style-steering method on
   those same cases. Use `build-blind-eval` and `score-blind-eval` to choose the
   system Jesse prefers without system labels while content-preservation checks
   still pass.

   For the local blind desk, prepare a separate held-out batch and let the desk
   reveal aggregate scores only after all labels are saved:

   ```sh
   <skill-dir>/scripts/jessify-rlhf prepare --workspace <workspace> \
     --name heldout-001 --purpose eval --model qwen3:4b --limit 20
   <skill-dir>/scripts/jessify-rlhf serve --workspace <workspace> \
     --batch heldout-001
   ```

   `jessify-rlhf` talks only to Ollama at `127.0.0.1`, binds its UI only to
   `127.0.0.1`, uses no external assets, and keeps system keys server-side.
   For a corporate or otherwise local-only workspace, do not substitute an
   external batch API or hosted evaluator.

9. Train a local adapter only if the profile stops improving.

   Prepare accepted winners as preference-informed supervised examples, then
   train a private MLX LoRA on Apple Silicon:

   ```sh
   <skill-dir>/scripts/jessify-train-local prepare --workspace <workspace>
   <skill-dir>/scripts/jessify-train-local train --workspace <workspace> \
     --name qwen3-4b-jessify
   ```

   This stage uses only chosen outputs for the MLX loss; it is not a substitute
   for DPO. Keep the separately exported `preferences/dpo.jsonl` for a true
   pairwise preference trainer. Do not call the adapter successful until it
   beats the unadapted and retrieval-only systems on the held-out blind batch.

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
