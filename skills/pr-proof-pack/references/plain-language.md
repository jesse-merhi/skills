# Plain-language PR writing

Apply the same test to the PR title, commit subjects, opening paragraph,
screenshot captions, verification steps, and diagram labels: could a reviewer
understand this without the agent thread?

## Restore the missing premise

The reader reset in `speak-fking-english` owns this move. Run it with the
reviewer as the reader, and back up just far enough to explain why the change
exists.

One thing it cannot know: a ticket ID, sprint name, internal nickname, file
path, or class name is not a premise. None of them explains the change to
someone outside the agent thread.

## Explain the break before the mechanism

Make the first two sentences answer:

1. What could a person or system observe going wrong?
2. Why did that matter?

Make the next two answer:

3. What does this PR do about the cause?
4. What happens now?

For a feature, use the missing capability in place of the break. Keep mechanism
names out of these sentences unless the term is already common in the project.
For example, prefer "the runner proves it can read the PR checkout" over
"runner-preflight provenance is promoted to complete."

After four sentences, a reviewer should be able to answer "why merge this?"
without reading the diff. Later sections may add proof, reproduction, and one
non-obvious implementation constraint; they should not retell the opening.

## PR title

Write one outcome a person can picture. Prefer an active verb and the observable
result. Keep required repository prefixes or ticket IDs, but do not let them
replace the human meaning.

Good:

- `Keep filters selected while results reorder`
- `Reject invalid phone numbers before saving suppliers`
- `Show broken and fixed outcomes in PR proof`

Weak:

- `Update filters`
- `SUP-142 validation changes`
- `Refactor proof pack workflow`

## Commit subjects

Make each commit subject a small, readable claim that belongs to the PR's story.
Follow repository convention, use an active verb, and name the behavioral or
reviewer-facing outcome rather than the touched files.

Good:

- `Persist uploaded proof only after validation`
- `Show real API outcomes as uploaded evidence`
- `Record changed UI interactions at a deliberate pace`

Weak:

- `Update SKILL.md`
- `Refactor screenshots`
- `Misc fixes`

Before the first push, reword unclear local commits. For commits already
published to a PR, explain that rewording requires a history rewrite and ask for
explicit human approval before doing it. Do not hide unclear commits with a
better PR title.

## Finish the writing pass

Run `speak-fking-english` over the title, opening, captions, verification steps,
and commit subjects. Do not load its full catalogue directly. The skill uses its
compact natural-writing pass for an implicit call and adds the catalogue only
when the user explicitly invoked it for this artifact.

A PR body is reviewer-facing text, so it stays specific and candid without
chatty asides. A reviewer checks these sentences against a diff, so every claim
must stay verifiable.

## Body, captions, and diagrams

Use the same nouns for the same actor and behavior throughout. The opening
supplies the premise; proof shows the broken and fixed outcomes in their native
form; diagrams explain only relationships that prose cannot; verification tells
the reviewer how to reproduce the result.

Read the finished PR from top to bottom and ask:

1. Do the first two sentences explain the break and impact without jargon?
2. Do the next two explain the fix and observable outcome?
3. Is every unfamiliar term defined before it is used?
4. Is every visual proving a fact that copyable text would lose?
5. Can a reviewer act without recovering context from a ticket or chat thread?
6. Does any sentence still read as generated or make the reviewer work to
   understand it?

Revise until the first five answers are yes and the last is no.
