# Corpus

## Quality labels

- `canonical`: Jesse endorses the writing as a voice reference.
- `usable`: recognizably Jesse, but not a gold-standard example. Retrieval
  ranks it below canonical material.
- `exclude`: retained for provenance but never used for generation or training.

Use original, substantially human-authored writing. A published URL is not
proof that the prose is canonical. Store AI-heavy drafts as preference sources
or rejected outputs instead.

## Splits

Split by complete document, never random paragraphs. An evaluation article
must contribute no training target, retrieved example, or reverse instruction.
Hold out writing across both topic and time when the corpus is large enough.

## Ingestion

`jessify-data ingest` accepts Markdown, MDX, and plain-text files. It removes
frontmatter, fenced code, media-only HTML, and media placeholders, then groups
nearby prose into context-bearing units. Short punchlines remain attached to
their surrounding passage rather than becoming meaningless isolated examples.

To reject a previously ingested document without deleting its provenance,
ingest the same source path again with `--quality exclude` and its existing
split. This replaces the document and all of its units as ineligible material.

The workspace layout is:

```text
corpus/documents.jsonl
corpus/units.jsonl
corpus/raw/
training/reverse-instruction-requests.jsonl
training/reverse-instruction-responses.jsonl
training/sft-pairs.jsonl
training/sft.jsonl
eval/reverse-instruction-requests.jsonl
eval/reverse-instruction-responses.jsonl
eval/cases.jsonl
eval/blind-cases.jsonl
eval/blind-key.jsonl
preferences/preferences.jsonl
preferences/dpo.jsonl
rlhf/batches/<batch>/meta.json
rlhf/batches/<batch>/blind-cases.jsonl
rlhf/batches/<batch>/blind-key.jsonl
rlhf/batches/<batch>/choices.jsonl
reviews/
```

The corpus contains personal writing. Keep the workspace local by default and
inspect generated pairs before sending them to any external training service.
