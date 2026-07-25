# Training And Evaluation

## System candidates

Benchmark the smallest set that answers the decision:

1. A strong frontier generator using neutral briefs and retrieved examples.
2. A modern open-weight instruct model with a LoRA, RoSA, or equivalent
   parameter-efficient adapter trained on reverse-instruction pairs.
3. A style-vector or dynamic authorship-transfer system only when its code and
   base model can be reproduced locally.

Do not choose a base model from reputation. Freeze the same prompts, retrieval
results, decoding budget, and evaluation set for every candidate.

## Training stages

1. Supervised adaptation: neutral brief and context to authentic passage.
2. Preference adaptation: source plus accepted output over rejected output.
3. Retrieval at inference: examples matched by rhetorical role and semantic
   need, excluding evaluation documents.

Keep preference adaptation separate from supervised data so a bad synthetic
brief cannot overwrite direct user feedback.

## What a preference case must be

The desk asks one question: which of these anonymous passages sounds like the
author wrote it. That question only works when the passage under comparison can
actually carry it, so `prepare` refuses sources that cannot.

A passage is rejected when it is **too specific** — when it is dense with named
systems, versions, people, and timestamps. Every candidate then either recites
the same list or visibly lacks it, so the author is really being asked to score
recall of details, not voice. `specificity_score` counts *distinct* one-off
references per hundred words; an entity repeated throughout a passage is one
topic, not many details. A passage can be unmistakably the author's and still
fail here, which is the point.

A passage is also rejected when it **reads as impersonal exposition**: correct
prose that uses no first person, no reader address, and fewer than
`--min-voice-families` distinct voice devices. There is no transferable voice to
learn from it.

After the brief exists, `prepare` measures **fact pressure** — required facts per
hundred words of the passage being replaced. A brief above
`--max-fact-pressure` is a reconstruction puzzle regardless of how clean the
prose looked, so the case is quarantined.

Tune with `--min-voice-families`, `--max-specificity`, and
`--max-fact-pressure`. `prepare` prints a text-free tally of why sources were
skipped, so the gate can be calibrated on a private corpus without exposing it.

## Local preference collection

Use `jessify-rlhf` when the author can label many examples. A preference batch
draws only from training documents and compares anonymous options:

- a local model without retrieved voice examples;
- the same local model with training-only voice retrieval;
- the authentic training passage as a hidden calibration control;
- a **voice-stripped twin** of that authentic passage, unless `--no-contrast`.

The twin matters. Every other option is rebuilt from a lossy brief, so the
authentic passage is the only one holding the full set of details, and a
labeller can spot it by richness instead of by voice. The twin keeps the
authentic content and drains only the register, so at least one pair in every
case differs in nothing but how it sounds.

Accepting a twin takes four cheap checks and one review: it must stay in a
length band around the original, stay on topic, use strictly fewer voice
devices, and not simply echo the original's word sequence. Only then does a
local review decide whether the claims survived. Word overlap alone cannot make
that call — measured on public prose, faithful flattenings score 0.36 to 0.53
content recall precisely because a register change replaces most of the
vocabulary on purpose. When no twin passes, `prepare` says which check rejected
it rather than dropping the option silently.

Briefs are held to the same standard as options. A required fact quoted straight
from the passage is not a fact, it is the author's sentence, and every candidate
then opens with it. `prepare` rejects any brief field that lifts a nine-word run
from the target, while short reuse of a real detail such as "over 530 security
advisories" still passes.

The desk separates two axes that a single click used to blur:

- **voice** — which option sounds like the author, or none of them;
- **faithfulness** — a per-option flag for changing or dropping a fact.

Flagging your own pick forces an edit before it can be saved, so a passage that
reads right but states something false never becomes a training target. Each
unselected option becomes a rejected response, and a rejection that also broke
the facts is marked so a later trainer can weight it differently.

```sh
jessify-rlhf prepare --workspace <workspace> --name preferences-001 \
  --purpose preference --model qwen3:4b --limit 30
jessify-rlhf serve --workspace <workspace> --batch preferences-001
jessify-rlhf status --workspace <workspace>
```

The server binds to loopback, stores progress after every card, keeps system
labels out of the browser payload, and exports to
`preferences/preferences.jsonl` plus `preferences/dpo.jsonl` only when the
batch is complete. Treat `none are acceptable` as useful negative evidence,
but do not manufacture a chosen response from it.

## Rejections change the next batch

Feedback that ends as a note is wasted. The desk also asks whether the source
was worth learning from at all, and the answer is routed:

| Answer | Effect |
| --- | --- |
| Fine | the case exports normally |
| Too specific | vetoes that passage; never asked about again |
| Not really prose | vetoes that passage |
| This whole article is not my voice | vetoes the entire document |

Vetoes land in `rlhf/eligibility.jsonl` and reach three places:

- `choose_units` skips the source in every later batch, preference and held-out
  alike;
- `retrieval_examples` stops offering it as evidence of how the author writes;
- `export-preferences` excludes it, and retracts pairs an earlier export already
  wrote from that source, including pairs from other batches. The reported
  `retracted` count says how many were removed.

Changing your mind is therefore safe: relabel the case, export again, and the
training set catches up. Pairs written before the schema recorded a source id
cannot be matched, so they are left alone.

This crosses the train/eval boundary deliberately and safely: a veto row records
only scope, source id, and verdict. It never records which option won, so
curating sources out of the eval pool cannot leak a held-out label into training
selection. Review what has accumulated with:

```sh
jessify-rlhf eligibility --workspace <workspace>
```

## Local adapter stage

After enough preferences exist, train a small MLX LoRA without sending prompts,
targets, labels, or logs to a hosted service:

```sh
jessify-train-local prepare --workspace <workspace>
jessify-train-local train --workspace <workspace> \
  --name qwen3-4b-jessify --model mlx-community/Qwen3-4B-4bit
```

The setup creates a private virtual environment and downloads only public base
weights into the workspace model cache. It does not enable experiment
reporting. The first adapter uses chosen answers as supervised targets, which
is preference-informed SFT rather than pairwise DPO. Preserve
`preferences/dpo.jsonl` so a later local DPO-capable trainer can use the full
chosen/rejected signal without rebuilding labels.

After training, build a new held-out batch containing the adapter alongside the
same baseline, retrieval, and authentic calibration systems:

```sh
jessify-rlhf prepare --workspace <workspace> --name heldout-adapter-001 \
  --purpose eval --model qwen3:4b --limit 20 \
  --adapter-path <workspace>/adapters/qwen3-4b-jessify \
  --mlx-model mlx-community/Qwen3-4B-4bit
jessify-rlhf serve --workspace <workspace> --batch heldout-adapter-001
```

Do not reuse a held-out batch generated before the adapter existed: candidate
ordering and labels must be frozen together for a valid blind comparison.

## Evaluation

Hold out complete documents. For every test unit, measure:

- content preservation: all required details remain and no new claim appears;
- narrative function: the passage performs its recorded rhetorical role;
- contextual flow: it connects to preceding and following passages;
- voice preference: Jesse chooses blindly between candidates;
- diversity: sentence shapes and phrasing do not collapse into a repeated
  template;
- copying: no suspicious phrase overlap with retrieved examples.

Use automatic measurements to find regressions, not to crown a winner. The
selection gate is Jesse's blind preference with content preservation enforced.

Prepare eval cases without adding them to the training export:

```sh
jessify-data requests --workspace <workspace> --split eval
jessify-data run-requests --workspace <workspace> --split eval \
  --command '<model-runner>' --resume
jessify-data merge-responses --workspace <workspace> --split eval \
  --responses <workspace>/eval/reverse-instruction-responses.jsonl
```

Collect candidate outputs as JSONL objects with `case_id`, `system`, and
`output`. Then hide system identity and score Jesse's selections:

```sh
jessify-data build-blind-eval --workspace <workspace> \
  --candidates <candidate-outputs.jsonl>
jessify-data score-blind-eval --workspace <workspace> \
  --choices <choices.jsonl>
```

Each choice is a JSONL object with `case_id` and the selected option `label`.
Keep `eval/blind-key.jsonl` away from the evaluator until all choices are
recorded.

Run a final independent `blog-review` on the best system's complete held-out
article. Paragraph-level wins do not prove that a whole story works.

The local desk can build the equivalent held-out comparison directly from eval
documents:

```sh
jessify-rlhf prepare --workspace <workspace> --name heldout-001 \
  --purpose eval --model qwen3:4b --limit 20
jessify-rlhf serve --workspace <workspace> --batch heldout-001
jessify-rlhf score --workspace <workspace> --batch heldout-001
```

Held-out choices are scores, never preference training data. The exporter
refuses an eval batch even if called directly. Do not show the blind key,
system scores, or authentic calibration identity before every case is labeled.

`score` reports a `calibration` block for the content-matched pair. If the
flattened twin beats the authentic passage on cases where both appear, the run
is suspect before any system comparison is read: either the labelling was noisy
or the twin kept voice it should have drained. Check that first, because every
other number in the batch depends on the author reliably recognising their own
prose when content is held constant.

For local-only or corporate corpora, run neutral-brief generation, retrieval,
candidate generation, labeling, adapter training, and evaluation on the local
machine. Public base weights may live in the normal model cache. Treat
adapters, optimizer state, prompts, candidates, labels, and logs as derived
private data.
