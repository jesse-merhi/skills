# Plain-Language PR Writing

Apply the same test to the PR title, commit subjects, opening paragraph,
screenshot captions, verification steps, and diagram labels: could a reviewer
understand this without the agent thread?

## Restore the Missing Premise

Back up just far enough to explain why the change exists. Lead with the idea in
everyday language. Name the technical mechanism only after the outcome is clear.

Use:

- simple words and short sentences;
- one concrete example when an abstract rule is hard to picture;
- established project terms, with a brief definition when they may be new;
- only the technical detail the reviewer needs to understand or act.

Do not assume a ticket ID, sprint name, internal nickname, file path, class name,
or agent-thread phrase explains the change.

## PR Title

Write one outcome a person can picture. Prefer an active verb and the observable
result. Keep required repository prefixes or ticket IDs, but do not let them
replace the human meaning.

Good:

- `Keep filters selected while results reorder`
- `Reject invalid phone numbers before saving suppliers`
- `Require visual evidence on every PR`

Weak:

- `Update filters`
- `SUP-142 validation changes`
- `Refactor proof pack workflow`

## Commit Subjects

Make each commit subject a small, readable claim that belongs to the PR's story.
Follow repository convention, use an active verb, and name the behavioral or
reviewer-facing outcome rather than the touched files.

Good:

- `Require Computer Use before publishing PR proof`
- `Show terminal checks as uploaded evidence`

Weak:

- `Update SKILL.md`
- `Refactor screenshots`
- `Misc fixes`

Before the first push, reword unclear local commits. For commits already
published to a PR, explain that rewording requires a history rewrite and ask for
explicit human approval before doing it. Do not hide unclear commits with a
better PR title.

## Body, Captions, and Diagrams

Use the same nouns for the same actor and behavior throughout. The opening
paragraph supplies the premise; screenshots show the evidence; captions say the
exact claim; diagrams explain the flow; verification tells the reviewer how to
reproduce it.

Read the finished PR from top to bottom and ask:

1. Does the first paragraph explain the outcome before the mechanism?
2. Can each title, caption, and diagram label stand on its own?
3. Is every unfamiliar term defined before it is used?
4. Does each visual make one useful point?
5. Can a reviewer act without recovering context from a ticket or chat thread?

Revise until every answer is yes.
