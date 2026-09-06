# Diff walkthroughs

Generate a local Git walkthrough with the existing helper:

```sh
skill-diff-page --root <repo> --base <direct-base> --head <head> --output <new.html>
```

It pins revisions, includes real per-file patches, and retains a digest. Replace its purpose prompts with evidence-backed explanations and inspect the rendered page.

For a stack, explain each layer against its direct base. Keep inherited changes out of that layer's story. For a standalone PR, omit stack navigation.

When the reader wants code detail, show the complete patch and explain each changed file beside its code. Preserve source lines. For large diffs, use search, collapse, and revision-keyed Viewed progress to keep reading manageable.

Lead with what changed and why. Add evidence or caveats where they contribute something the annotated code doesn't show. A walkthrough is neither a code review nor proof that the feature ran.
