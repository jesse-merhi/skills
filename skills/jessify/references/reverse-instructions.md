# Reverse Instructions

Reverse instructions convert a finished Jesse passage into a neutral source
that can train a rewriter without requiring an original draft.

For each corpus unit, generate JSON with:

- `neutral_brief`: the facts, claims, story beats, and intended reader movement
  in plain prose that does not imitate Jesse;
- `rhetorical_role`: one of `opening`, `setup`, `explanation`, `example`,
  `transition`, `aside`, `argument`, `reflection`, `punchline`, or `conclusion`;
- `must_preserve`: atomic details a rewrite may not lose or invent;
- `structure`: the logical sequence without sentence-level phrasing.

Generate multiple neutral briefs per target when possible. Vary the wording and
level of compression while preserving the same information.

Reject a reverse instruction when it:

- quotes a distinctive phrase from the target;
- describes style instead of content;
- invents motivation, chronology, or technical facts;
- omits the reason the passage exists in the surrounding section;
- turns a personal story into a generic topic prompt.

The target remains the authentic passage. The neutral brief is never treated as
canonical writing.

## Model runner contract

`run-requests` is intentionally provider-agnostic. The configured command is
started once per request. It receives only the prompt on stdin and must print
one JSON object on stdout. It must not add commentary around the JSON. Use
`--resume` so an interrupted run keeps valid completed responses.

An external batch API can be used instead. Preserve each request's `custom_id`
in the returned JSONL so `merge-responses` can join it to the right target.
