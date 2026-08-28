# PR and diff walkthroughs

Use this internal mode when a reader wants to understand a PR, branch, commit,
diff, or stack without requesting a code review.

## Source contract

- Capture base and head identities before fetching the diff and verify them
  after generation. Fail if either changed.
- For a stack, gather each open layer bottom-to-top and explain every layer from
  its direct base. Never attribute inherited changes to a higher layer.
- Show the complete direct-base patch when the user wants code-reading detail.
  Omit it only when unavailable or deceptive, and say why.
- Preserve every source line while removing machine-only headers such as
  `diff --git`, `index`, and raw hunk coordinates.
- Check parsed file and line counts against source metadata and retain a digest
  for revision-keyed state.

## Page structure

Lead with the changed behavior and implementation story. For a standalone PR,
omit stack navigation. For a stack, use one compact navigator labelled with PR,
base, position, and short outcome; switching layers must update its outcome,
files, diff, and proof together.

Give every changed file one anchored explanation of its purpose. Add line-level
notes only for behavior, constraints, or trade-offs that are not obvious from
the patch. Tests remain changed files; explain what behavior they prove rather
than repeating them in a separate tab.

For a substantial multi-file diff, add filename search, expand/collapse, and a
Viewed state keyed by PR, exact revision, and file. Keep the primary file open
and unusually large or generated files closed initially. Do not put aggregate
line counts or process narration above the code unless they answer a real
reader question.

Use outcome-first, task-specific headings. Show extra proof, rollout notes, or
open questions only when they add information the annotated diff cannot carry.
