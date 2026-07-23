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

## Local preference collection

Use `jessify-rlhf` when the author can label many examples. A preference batch
draws only from training documents and compares three anonymous options:

- a local model without retrieved voice examples;
- the same local model with training-only voice retrieval;
- the authentic training passage as a hidden calibration control.

The evaluator can choose a winner, reject every option, tag the failure mode,
or edit the winner. An edit becomes the chosen response. Each unselected
option becomes a separate rejected response, producing DPO-style pairs.

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

For local-only or corporate corpora, run neutral-brief generation, retrieval,
candidate generation, labeling, adapter training, and evaluation on the local
machine. Public base weights may live in the normal model cache. Treat
adapters, optimizer state, prompts, candidates, labels, and logs as derived
private data.
