# Plain-language PR writing

Apply the same test to the PR title, commit subjects, opening paragraph,
screenshot captions, verification steps, and diagram labels: could a reviewer
understand this without the agent thread?

## Restore the missing premise

Back up just far enough to explain why the change exists. Lead with the idea in
everyday language. Name the technical mechanism only after the outcome is clear.

Use:

- simple words and short sentences;
- one concrete example when an abstract rule is hard to picture;
- established project terms, with a brief definition when they may be new;
- only the technical detail the reviewer needs to understand or act.

Do not assume a ticket ID, sprint name, internal nickname, file path, class name,
or agent-thread phrase explains the change.

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

- `Allow Browser Use to publish PR proof safely`
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

## Cut AI tells

Run the catalogue in
[`speak-fking-english/references/ai-tells.md`](../../speak-fking-english/references/ai-tells.md)
over the title, opening, captions, verification steps, and commit subjects.
That file is the single copy of the rules. Do not restate them here.

One consequence is worth naming here, because it changed a label the skills
repository used to spell with a dash. Matched proof is labeled
`Before: direct base` and `After: PR`.

A PR body is reviewer-facing text, so it takes the reviewer-facing voice rules
rather than the six a reply spoken to the user gets. `ai-tells.md` says which.
A reviewer checks these sentences against a diff, so every claim must stay
verifiable.

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
6. Does any sentence still carry a catalogued AI tell?

Revise until every answer is yes.
