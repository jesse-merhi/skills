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
