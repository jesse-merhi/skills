# Voice Profile

## Why measure at all

"Sounds like Jesse" is not a specification, and a model asked to write casually
produces an impersonation rather than a likeness. Measured against this corpus,
model output used roughly five times the author's contraction rate and four times
his rate of opening sentences with "So" or "But", while using almost no first
person and almost none of his long winding sentences. Every one of those errors
is invisible to a reader who only asks "is this casual enough?" and obvious to a
number.

So the profile exists to answer three questions the rest of the workflow depends
on: what is this author's range, how far is this draft from it, and which
dimension should the next attempt fix.

## Building it

```sh
jessify-voice profile --workspace <workspace> --canonical-only
jessify-voice card --workspace <workspace>
```

`profile` measures fourteen dimensions over every canonical passage of at least
`--min-words` words and stores the 10th, 50th and 90th percentile of each in
`voice/profile.json`. Pass `--split train` to leave held-out documents unmeasured
when you intend to evaluate on them.

`card` renders that profile as prompt input: the ranges, what they mean in
practice, and real sentences from the corpus showing each device. Give the card
to the generator; do not describe the voice in adjectives.

## How scoring works

A draft is penalised for leaving the author's range, in either direction, and
scored zero anywhere inside it. Both edges matter. Overshooting is the failure
mode a naive prompt produces.

Silence inside the band is deliberate. A single paragraph will not contain an
ellipsis merely because the author uses them sometimes, and demanding one would
manufacture a tic.

There is one exception, and it was found the hard way. A dimension the author
uses in at least 80% of passages gets its floor lifted above zero, because
otherwise its complete absence sits inside the range unpunished. First person is
the case that matters: a rewrite that referred to "the author" throughout scored
as though it were fine, since a tenth of the corpus passages contain no first
person and the 10th percentile was therefore zero.

```sh
jessify-voice score --workspace <workspace> --file <draft>
```

The author's own held-out passages score about 0.008. Treat anything above 0.05
as not yet in their voice, and read the named deviations instead of guessing.

## Two flags that sit beside the distance

Neither is folded into the score. Both are noisier than the measured bands, and
averaging them in would corrupt a number that currently separates the author from
a model three times in three.

**Words they have never written.** `profile` takes a list of words a model reaches
for when performing "good writing" — delve, leverage, seamless, furthermore,
comprehensive, harness — and keeps only the ones absent from the whole corpus.
Against the public corpus, 79 of 88 survived that filter. Unedited model prose
scored 7.84 of them per hundred words; the author's own writing and his edited
sections scored between 0.0 and 0.9. It is a blunt instrument that catches raw
model output instantly and says little about prose someone has already worked on.

Only the filtered list reaches `profile.json`, never the corpus vocabulary. On a
private corpus that file would otherwise become a word list of private writing.

**Sentences that hook onto nothing.** A run of consecutive sentences opening with a
fresh noun phrase — no pronoun pointing back, no conjunction carrying the previous
thought on — is the "one thing after another" that reads as a machine emptying its
notes. It is measured as a *run*, not an average, and that is the whole point: in a
real 3,521-word article the paragraph doing this was invisible to every average,
and the run was still seven sentences long.

Getting there took three attempts. Counting explanatory connectives rated the worst
paragraph in that article *highest*, because it happened to contain the word
"principle". A bare-declarative rate put a section scoring 0.011 at 71%, above
sections reading five times worse. A back-reference rate put a bad section inside
the range and a good one below it. Only the local run survived contact with the
corpus, and even it is a warning rather than a score.

## Deliberately not measured

All-capitals words. Counted against this corpus they were 96% acronyms — AI, LLM,
PR, GPT — and 4% emphasis. The dimension tracked topic vocabulary rather than
voice, and once absence was penalised it started demanding acronyms. Removing it
improved separation between the author's prose and model output.

The general rule: a dimension that moves with the subject matter does not belong
in a voice profile, however tempting it looks.

## Validating a change to the profile

Two checks, both cheap, both objective.

**Blind ranking.** Score the author's real passages against model rewrites of the
same content. Their own prose must rank closest. On held-out public material the
current profile gives 0.008 for the author, 0.050 for an unguided model, 0.097
for a deliberately flattened twin, and 0.113 for retrieval prompting, ranking the
author closest in 3 of 3 cases. Retrieval scoring worst is not an error; it
copies visible tics and overshoots them.

**Round trip.** Take a held-out passage, flatten it into corporate register, then
rewrite it back and compare all three scores. Exclude the source document from
retrieval with `--exclude-document`, or the original will be handed back to the
generator as an example and copied.

## Limits

The profile is unreliable on passages that carry little voice. A technical
recital of tool names and configuration scored 0.049 as genuine authored prose,
close to what an unguided model produces, because there is almost no voice in it
to measure. Judge such passages by content, not by this number.
