# AI tells

Cutting AI patterns is half the job. Sterile, voiceless text reads as machine
written even when every pattern is gone. Run both passes.

1. Scan the draft against the catalogue below and list every match.

2. Rewrite each match. Keep the facts, scope, and requested action unchanged.

3. Add voice, using the rules for the destination.

4. Self-audit. Ask what still makes this obviously AI generated, then fix what
   the scan missed.

Done when no catalogued pattern survives, no fact changed, and the draft has a
recognisable voice.

## Voice

All six rules apply to a reply you are speaking to the user.

Only the first three apply to reviewer-facing text: anything another reader
checks against a diff, a run, or a record. PR titles and bodies, captions,
commit subjects, verification steps, finding cards, review reports, and
consult questions are all reviewer-facing, whether a calling skill saves them
or you return them in chat. When both descriptions fit, treat the text as
reviewer-facing.

Both:

- **Be specific.** Not "this is concerning" but "the runner published a review
  without ever opening the checkout".
- **Vary rhythm.** Short sentences. Then longer ones that take their time.
- **Acknowledge complexity.** "Faster, but it drops the audit trail" beats
  "faster".

Speaking to the user only:

- **Have opinions.** React to the facts instead of listing pros and cons at
  equal weight.
- **Use "I" when it fits.** First person is not unprofessional.
- **Let some mess in.** Flawless parallel structure looks generated.

## Content

1. **Puffery.** "pivotal moment", "testament to", "evolving landscape",
   "setting the stage for", "indelible mark", "deeply rooted". State what
   happened.
2. **Name-dropping.** Listing publications without content. Pick one and say
   what it said.
3. **Superficial -ing phrases.** "highlighting...", "ensuring...",
   "reflecting...", "showcasing...", "fostering...". Delete, or expand into a
   real claim.
4. **Promotional language.** "nestled", "vibrant", "breathtaking",
   "groundbreaking", "renowned", "stunning", "must-visit". Describe neutrally.
5. **Vague attributions.** "Experts believe", "Industry reports suggest", "Some
   critics argue". Name the source or cut the sentence.
6. **Formulaic challenges.** "Despite challenges... continues to thrive."
   Replace with the specific facts.

## Language

7. **AI vocabulary.** Additionally, crucial, delve, enduring, enhance,
   fostering, garner, interplay, intricate, landscape (abstract), pivotal,
   showcase, tapestry (abstract), testament, underscore, vibrant. Use plain
   words.
8. **Fancy ways to say "is".** "serves as", "stands as", "boasts", "features".
   Say "is" or "has".
9. **"Not just X, but Y."** State the point directly.
10. **Rule of three.** Forcing ideas into groups of three. Use the natural
    number.
11. **Synonym cycling.** Use the same word for the same actor and behavior.
    Distinct names for distinct things stay distinct: if `Job`, `Task`, and
    `Run` are three tables, they are not synonyms. Protagonist, main
    character, central figure, hero in
    one paragraph. Pick one word and repeat it.
12. **False ranges.** "from X to Y" where X and Y sit on no shared scale. List
    the items.

## Style

Every rule in this section governs your own prose. When the draft quotes
someone else's text, or when a character is itself the finding, reproduce it
exactly. Normalising a curly quote or a stray dash inside a bug report
describes a file state that does not exist.

13. **Em dashes.** Do not use them. Use a period or a comma. Do not substitute
    parentheses, en dashes, or a hyphen standing in for a dash, which trade one
    tell for another. If a thought needs separation, end the sentence.

    The skills repository labels matched proof `Before: direct base` and
    `After: PR`. The colon is the label separator. Do not reintroduce the dash
    form.

14. **Colons.** A colon before a list, an example, or a label is fine. A colon
    as a mid-sentence connector is not. "If you are coming from traditional
    automation: instead of registering handlers, you describe conditions" gains
    nothing from the colon. Let the point stand without the comparison framing.
15. **Boldface.** Bold the few phrases a skimming reader must not miss. Do
    not bold every proper noun or acronym. Bolding stays useful for a
    literal control the reader has to find, such as **Use Admin**.
16. **Inline-header lists.** The tell is a bold label and colon that restates
    the line: "**Performance:** Performance improved...". Convert those to
    prose. A bold lead-in that ends in a period, names the item, and is
    followed by genuinely new detail is fine: "**Schema in TypeScript.**
    Tables live in one file."
17. **Title case headings.** Use sentence case. This does not reach a heading
    another workflow looks up by its exact spelling, such as the section names
    in a note template. Renaming those breaks the lookup.
18. **Decorative emojis.** Remove them from headings and bullets.
19. **Curly quotes.** Use straight quotes.

## Communication artifacts

20. **Chatbot phrases.** "I hope this helps!", "Let me know if...", "Of
    course!", "Certainly!", "Found the smoking gun!" Remove.
21. **Cutoff disclaimers.** "While specific details are limited..." Find the
    source or cut the sentence.
22. **Sycophantic tone.** "Great question!", "You're absolutely right!" Answer
    directly.

## Filler

23. **Filler phrases.** "In order to" becomes "To". "Due to the fact that"
    becomes "Because". "It is important to note that" gets deleted.
24. **Excessive hedging.** "could potentially possibly be argued that it might"
    becomes "may".
25. **Generic conclusions.** "The future looks bright." State the specific plan
    or fact.

## Jargon

26. **Abstract metaphor nouns.** Substrate, wedge, locus, vantage, nexus,
    bedrock, modality, paradigm, gold-plating, endgame, north star, flywheel,
    and the metaphorical use of vector, primitive, harness, surface,
    scaffolding, ratchet, and evacuate. These sound technical and usually have
    a plainer concrete word.

    Every entry below applies only when the word is standing in for something
    plainer. Ask what the word denotes here. If it names a real thing in the
    domain, it stays.

    | Metaphorical use | Write |
    | --- | --- |
    | substrate | base |
    | wedge in | add |
    | vector for | way, method |
    | primitive (a building block of a design) | building block |
    | harness (the thing running the work) | name it |
    | surface (when a plainer word exists) | the API, the screen, the changed code |
    | scaffolding (as in temporary support) | setup code, starter files |
    | gold-plating | more than the job needs |
    | ratchet | the mechanism, or "a limit that only tightens" |
    | evacuate (for moving code) | move out |
    | endgame | the last phase |

    The test is whether a plainer word carries the same meaning. "API surface"
    becomes "the API" and loses nothing, so it goes. "Attack surface" has no
    plainer equivalent, so it stays.

    The literal senses keep their names. An attack surface, a rendering
    surface, a test harness, a `harness = false` build key, a synchronization
    or cryptographic primitive, a primitive type, a vector index, and the
    `Primitive Obsession` code smell all denote real things. Rewriting them
    corrupts the claim rather than clarifying it.

    Proper nouns keep their names too. A package, product, tool, or
    third-party API is called what its owner called it, even when that name
    is a banned word. The skills repository records the
    `browser-harness` dependency at a pinned commit in `external.md`, and that
    record is only useful if the name still matches the project a reader has
    to go and find. Quoted external text is the same. Fix your own prose, not
    a quotation.

    Familiarity is not a defence for a genuine metaphor. If a phrase like
    "proof surface" is only comfortable because the repository repeats it,
    rename the concept in the prose. This rule edits writing, so it never
    licenses renaming an identifier, a config key, or a public API on its own.

## Plain speech

27. **Say what it does, not how it feels.** "the database stays close at hand",
    "SQL you can read", "types that follow your schema" all name a feeling. Name
    the mechanism or a number instead: "`.toSQL()` returns the exact string sent
    to the database", "a column rename fails the build". Ask what the sentence
    tells the reader to do or know, then write that. If you cannot restate it as
    a concrete instruction, fact, or number, cut it. One more check: a sentence
    that could appear unchanged in another project's documentation says nothing
    about this one.
28. **Dense sentences.** If the reader has to backtrack to parse a sentence,
    split it or drop clauses. One idea per sentence.
29. **Active voice.** Catch "is/are/was/were + past participle" and name the
    actor. "queries are validated" becomes "the compiler validates queries".
    Passive is fine only when the actor is unknown or genuinely does not matter.
30. **Adverbs.** "runs quickly" becomes "is fast", or the measured number.
    "significantly improves" becomes the delta you measured. If you did not
    measure one, cut the claim rather than inventing a figure. An adverb
    propping up a weak verb means the verb is wrong.
31. **Plain words.** "utilize" becomes "use". "leverage" becomes "use".
    "facilitate" becomes "help". "numerous" becomes "many". "in the event that"
    becomes "if". The fancier synonym is rarely clearer.

    As in rule 26, this covers the padded sense only. Financial leverage and
    leverage as a named design property both denote real things and stay.
