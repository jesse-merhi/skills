# AI tells

This is the deep catalogue pass. Load it only when `SKILL.md` selects the
explicit route.

Cutting AI patterns is half the job. Sterile, voiceless text reads as machine
written even when every pattern is gone. Run both passes.

1. Scan the draft against the catalogue below and list every match.

2. Rewrite each match. Keep the facts, the scope, the requested action, and
   the intended tone unchanged.

3. Add voice, using the rules for the destination.

4. Self-audit. Ask what still makes this obviously AI generated, then fix what
   the scan missed.

Done when no catalogued pattern survives, no fact changed, and the draft has a
recognisable voice.

## What no rule reaches

These three exceptions apply to every rule below. For a rule about a word, the
test is what the word denotes here: if it names a real thing, it stays. For the
character and formatting rules, the quoted-text exception is the one that
applies.

**Literal senses.** A rule bans a word used as padding or metaphor, never the
word used to name something specific. An attack surface, a test harness, an
agent harness such as Claude Code or Codex, a `harness = false` build key, a
cryptographic primitive, a vector index, WCAG's `Target Size (Enhanced)`
criterion, and a Cargo `[features]` table all denote real things. Rewriting
them corrupts the claim rather than clarifying it.

**Proper nouns.** A package, product, tool, standard, third-party API, or named
concept keeps the name its owner gave it, even when that name contains a banned
word. `Primitive Obsession` is the code smell's name, not a description you may
reword.

**Quoted text.** Fix your own prose, not a quotation. When the draft reproduces
someone else's words, or when a character is itself the finding, reproduce it
exactly. Normalising a curly quote or a stray dash inside a bug report describes
a file state that does not exist.

## Voice

All six rules apply to a reply you are speaking to a person, whatever that
reply is about. Describing work someone will check does not make it
reviewer-facing; addressing a person keeps it user-facing. A consult question
is the clearest case, and `review-guardrails` routes it that way too.

Only the first three apply to reviewer-facing text: an artifact you write for
a reader who is not in this conversation and who will check it against a diff,
a run, or a record. PR titles and bodies, captions, commit subjects,
verification steps, finding cards, and review reports saved to a file are all
reviewer-facing. When a single piece of text is both, split it: keep the reply
in your own voice and write the saved artifact in the reviewer-facing one.

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
- **Let some mess in.** Perfect structure looks machine-made.

## Content

1. **Puffery.** "pivotal moment", "testament to", "evolving landscape",
   "setting the stage for", "indelible mark", "deeply rooted". State what
   happened.
2. **Name-dropping.** Listing publications without context. Pick one and say
   what it said.
3. **Superficial -ing phrases.** "highlighting...", "ensuring...",
   "reflecting...", "showcasing...", "fostering...". Delete, or expand into a
   real claim. Upstream says "with real sources"; this catalogue runs over
   writing about code, where the repair is usually a fact rather than a
   citation.
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
11. **Synonym cycling.** Protagonist, main character, central figure, and hero
    in one paragraph. Pick one word for one actor and repeat it.

    Distinct names for distinct things stay distinct. If `Job`, `Task`, and
    `Run` are three tables, they are not synonyms and collapsing them makes
    the sentence wrong.
12. **False ranges.** "from X to Y" where X and Y sit on no shared scale. List
    the topics directly.

## Style

13. **Em dashes.** Do not use them. Use a period or a comma. Do not substitute
    parentheses, en dashes, or a hyphen standing in for a dash, which trade one
    tell for another. If a thought needs separation, end the sentence.

14. **Colons.** A colon before a list, an example, or a label is fine. A colon
    as a mid-sentence connector is not. "If you are coming from traditional
    automation: instead of registering handlers, you describe conditions" gains
    nothing from the colon. End the first clause and let the second stand:
    "Traditional automation registers handlers. Here you describe conditions."
15. **Boldface.** Bold the few phrases a skimming reader must not miss. Do
    not bold every proper noun or acronym. Bolding stays useful for a
    literal control the reader has to find, such as **Use Admin**.
16. **Inline-header lists.** The tell is a bold label and colon that restates
    the line: "**Performance:** Performance improved...". Convert those to
    prose. A bold lead-in that ends in a period, names the item, and is
    followed by genuinely new detail is fine: "**Schema in TypeScript.**
    Tables live in one file."
17. **Title case headings.** Use sentence case. This does not reach a heading
    something else looks up by its exact spelling, whether that is a test, a
    later session reading a note, or prose elsewhere that names the section.
    Renaming those breaks the lookup. Check before renaming; a template
    heading nothing refers to is not exempt.
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
    scaffolding, ratchet, and evacuate. These sound technical and usually have a
    plainer concrete word. Pick the concrete word.

    Each row applies only to the metaphor. The literal sense of the same word
    keeps its name.

    | Metaphorical use | Write |
    | --- | --- |
    | substrate | base |
    | wedge in | add |
    | vector (as in "attack vector") | way, method |
    | primitive (a building block of a design) | building block |
    | harness (as metaphor) | name the thing running the work |
    | surface (a vague area, not a named one) | the API, the screen, the diff |
    | scaffolding (as metaphor) | setup code, starter files |
    | gold-plating | more than the job needs |
    | ratchet (as metaphor) | the mechanism, or "a limit that only tightens" |
    | evacuate (for moving code) | move out |
    | endgame | the last phase |

    At the boundary, ask whether the phrase is a named thing people look up or
    a vague gesture at an area. "Attack surface" stays; "the proof surface"
    goes, even where a repository repeats it. Renaming prose is all this rule
    does. It never licenses renaming an identifier, a config key, or an API.

## Plain speech

27. **Say what it does, not how it feels.** "the database stays close at hand",
    "SQL you can read", "types that follow your schema" all name a feeling. Name
    the mechanism or a number instead: "`.toSQL()` returns the exact string sent
    to the database", "a column rename fails the build". Ask what the sentence
    tells the reader to do or know, then write that. If you cannot restate it as
    a concrete instruction, fact, or number, cut it. One more check, for a
    sentence that claims something about this project: if it could appear
    unchanged in another project's documentation, it says nothing about this
    one. Cut it. A portable instruction is meant to be portable and stays.
28. **Shorten or split dense sentences.** If the reader has to backtrack to
    parse a sentence, split it or drop clauses. One idea per sentence.
29. **Active voice.** Prefer it. Catch "is/are/was/were + past participle" and
    name the actor: "queries are validated" becomes "the compiler validates
    queries", "the file is parsed by the loader" becomes "the loader parses the
    file". Passive is fine only when the actor is unknown or genuinely does not
    matter.
30. **Cut adverbs, or use a stronger verb.** "runs quickly" becomes "is fast",
    or the measured number. "significantly improves" becomes the delta you
    measured. Never invent a figure. If you did not measure one, either state
    the direction without a magnitude, as in "retries drop; I did not measure by
    how much", or cut the claim. An adverb propping up a weak verb means the
    verb is wrong.
31. **Prefer the plain word.** "utilize" becomes "use". "leverage" becomes
    "use". "facilitate" becomes "help". "numerous" becomes "many". "in the
    event that" becomes "if". The fancier synonym is rarely clearer.

    The padded sense only. Financial leverage, and leverage as a named design
    property such as the one `improve-codebase-architecture` defines, both name
    real things and stay.
